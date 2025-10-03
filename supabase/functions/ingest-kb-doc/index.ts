import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chunk text with overlap
function chunkText(text: string, chunkSize = 900, overlap = 150): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

// Generate embeddings using Lovable AI
async function generateEmbedding(text: string): Promise<number[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Embedding API error:', response.status, errorText);
    throw new Error(`Failed to generate embedding: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Extract text from PDF using pdf-parse
async function extractTextFromPDF(fileUrl: string): Promise<string> {
  console.log('Fetching PDF from:', fileUrl);
  
  try {
    // Fetch the PDF file
    const pdfResponse = await fetch(fileUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log(`PDF downloaded, size: ${pdfBuffer.byteLength} bytes`);

    // Use pdf-parse library to extract text
    const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1');
    const data = await pdfParse.default(new Uint8Array(pdfBuffer));
    
    console.log(`Extracted ${data.text.length} characters from ${data.numpages} pages`);
    return data.text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`PDF extraction failed: ${errorMessage}`);
  }
}

// Background processing function
async function processDocument(docId: string, supabase: any) {
  console.log(`Starting background processing for document: ${docId}`);
  
  try {
    // Get document details
    const { data: doc, error: docError } = await supabase
      .from('kb_docs')
      .select('*')
      .eq('id', docId)
      .single();

    if (docError) throw docError;

    // Extract text from PDF
    const fullText = await extractTextFromPDF(doc.file_url);

    // Chunk the text
    const chunks = chunkText(fullText);
    console.log(`Created ${chunks.length} chunks`);

    // Process chunks with embeddings in batches to manage memory
    const batchSize = 5;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, Math.min(i + batchSize, chunks.length));
      
      for (let j = 0; j < batch.length; j++) {
        const chunkIndex = i + j;
        const chunkText = batch[j];
        
        // Generate embedding
        const embedding = await generateEmbedding(chunkText);

        // Insert chunk
        const { error: chunkError } = await supabase
          .from('kb_chunks')
          .insert({
            doc_id: docId,
            chunk_index: chunkIndex,
            text: chunkText,
            embedding: embedding,
          });

        if (chunkError) {
          console.error('Error inserting chunk:', chunkError);
          throw chunkError;
        }

        console.log(`Processed chunk ${chunkIndex + 1}/${chunks.length}`);
      }
    }

    // Update job status to completed
    await supabase
      .from('kb_ingest_jobs')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
      })
      .eq('doc_id', docId);

    console.log(`Ingestion completed for document: ${docId}`);
  } catch (error) {
    console.error('Error in background processing:', error);
    
    // Update job with error
    await supabase
      .from('kb_ingest_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        finished_at: new Date().toISOString(),
      })
      .eq('doc_id', docId);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { docId } = await req.json();

    if (!docId) {
      throw new Error('Document ID is required');
    }

    console.log(`Received ingestion request for document: ${docId}`);

    // Create ingest job with processing status
    const { data: job, error: jobError } = await supabase
      .from('kb_ingest_jobs')
      .insert({
        doc_id: docId,
        status: 'processing',
        file_url: '',
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Start background processing
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    EdgeRuntime.waitUntil(processDocument(docId, supabase));

    // Return immediate response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Document ingestion started',
        jobId: job.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ingest-kb-doc:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
