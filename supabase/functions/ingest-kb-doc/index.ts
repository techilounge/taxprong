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

// Generate embeddings in batch for efficiency
async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
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
      input: texts,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Batch embedding API error:', response.status, errorText);
    throw new Error(`Failed to generate embeddings: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.data.map((item: any) => item.embedding);
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

// Background processing function with timeout and progress tracking
async function processDocument(docId: string, supabase: any) {
  const startTime = Date.now();
  const TIMEOUT_MS = 4 * 60 * 1000; // 4 minutes (leaving 1 min buffer for 5 min function limit)
  
  console.log(`Starting background processing for document: ${docId}`);
  
  try {
    // Get document details
    const { data: doc, error: docError } = await supabase
      .from('kb_docs')
      .select('*')
      .eq('id', docId)
      .single();

    if (docError) {
      throw new Error(`Failed to fetch document: ${docError.message}`);
    }

    console.log(`Processing document: ${doc.title}, URL: ${doc.file_url}`);

    // Check for API key early
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured - contact support');
    }

    // Extract text from PDF with better error handling
    let fullText: string;
    try {
      fullText = await extractTextFromPDF(doc.file_url);
      
      if (!fullText || fullText.trim().length < 50) {
        throw new Error('PDF appears to be empty or text extraction failed. Ensure PDF contains searchable text, not just images.');
      }
      
      console.log(`Successfully extracted ${fullText.length} characters from PDF`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown PDF error';
      throw new Error(`PDF extraction failed: ${errMsg}`);
    }

    // Chunk the text
    const chunks = chunkText(fullText);
    console.log(`Created ${chunks.length} chunks to process`);

    if (chunks.length === 0) {
      throw new Error('No text chunks created from document');
    }

    // Process chunks in batches with progress tracking
    const batchSize = 10; // Process 10 chunks at a time for efficiency
    let processedCount = 0;
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      // Check timeout
      if (Date.now() - startTime > TIMEOUT_MS) {
        throw new Error(`Processing timeout after ${Math.floor((Date.now() - startTime) / 1000)}s. Try uploading a smaller document or splitting it into parts.`);
      }

      const batch = chunks.slice(i, Math.min(i + batchSize, chunks.length));
      const batchStartIndex = i;
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} (chunks ${i + 1}-${i + batch.length})`);

      try {
        // Generate embeddings for entire batch at once (much faster)
        const embeddings = await generateEmbeddingsBatch(batch);

        // Insert all chunks from this batch
        const chunkRecords = batch.map((text, idx) => ({
          doc_id: docId,
          chunk_index: batchStartIndex + idx,
          text: text,
          embedding: embeddings[idx],
        }));

        const { error: insertError } = await supabase
          .from('kb_chunks')
          .insert(chunkRecords);

        if (insertError) {
          console.error('Batch insert error:', insertError);
          throw new Error(`Failed to insert chunks: ${insertError.message}`);
        }

        processedCount += batch.length;
        console.log(`✓ Batch complete: ${processedCount}/${chunks.length} chunks processed (${Math.round(processedCount / chunks.length * 100)}%)`);

        // Update progress in job table (optional, helps with debugging)
        await supabase
          .from('kb_ingest_jobs')
          .update({
            error_message: `Processing: ${processedCount}/${chunks.length} chunks (${Math.round(processedCount / chunks.length * 100)}%)`,
          })
          .eq('doc_id', docId);

      } catch (batchError) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, batchError);
        throw batchError;
      }
    }

    // Update job status to completed
    const duration = Math.floor((Date.now() - startTime) / 1000);
    await supabase
      .from('kb_ingest_jobs')
      .update({
        status: 'completed',
        error_message: null, // Clear progress message
        finished_at: new Date().toISOString(),
      })
      .eq('doc_id', docId);

    console.log(`✓ Ingestion completed for document: ${docId} in ${duration}s (${processedCount} chunks)`);
    
  } catch (error) {
    console.error('❌ Error in background processing:', error);
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    // Update job with detailed error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during processing';
    await supabase
      .from('kb_ingest_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        finished_at: new Date().toISOString(),
      })
      .eq('doc_id', docId);

    console.log(`Processing failed after ${duration}s: ${errorMessage}`);
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
