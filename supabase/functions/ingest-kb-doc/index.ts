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

// Parse PDF text (simplified - in production use a proper PDF parser)
async function extractTextFromPDF(fileUrl: string): Promise<string> {
  // For now, return placeholder text
  // In production, use a PDF parsing library or service
  console.log('Extracting text from PDF:', fileUrl);
  
  // This is a stub - in production you'd actually parse the PDF
  return `Nigeria Tax Law Document\n\nThis is extracted text from the PDF at ${fileUrl}.\n\nIn a production system, this would contain the actual parsed content from the PDF file, including information about VAT regulations, CIT requirements, stamp duty procedures, and other Nigerian tax compliance matters.`;
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

    console.log(`Starting ingestion for document: ${docId}`);

    // Create ingest job
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

      // Process chunks with embeddings
      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        
        // Generate embedding
        const embedding = await generateEmbedding(chunkText);

        // Insert chunk
        const { error: chunkError } = await supabase
          .from('kb_chunks')
          .insert({
            doc_id: docId,
            chunk_index: i,
            text: chunkText,
            embedding: embedding,
          });

        if (chunkError) {
          console.error('Error inserting chunk:', chunkError);
          throw chunkError;
        }

        console.log(`Processed chunk ${i + 1}/${chunks.length}`);
      }

      // Update job status
      await supabase
        .from('kb_ingest_jobs')
        .update({
          status: 'completed',
          finished_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      console.log(`Ingestion completed for document: ${docId}`);

      return new Response(
        JSON.stringify({
          success: true,
          chunksCreated: chunks.length,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      // Update job with error
      await supabase
        .from('kb_ingest_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          finished_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      throw error;
    }
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
