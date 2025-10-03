import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Document } from "https://esm.sh/@langchain/core@0.3.29/documents";
import { RecursiveCharacterTextSplitter } from "https://esm.sh/@langchain/textsplitters@0.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IngestRequest {
  docId: string;
  fileUrl: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { docId, fileUrl }: IngestRequest = await req.json();

    console.log(`Starting ingestion for doc ${docId}, file: ${fileUrl}`);

    // Create ingest job
    const { data: job, error: jobError } = await supabase
      .from('kb_ingest_jobs')
      .insert({
        status: 'processing',
        file_url: fileUrl,
        doc_id: docId,
      })
      .select()
      .single();

    if (jobError) throw jobError;

    try {
      // Fetch the PDF file
      const pdfResponse = await fetch(fileUrl);
      if (!pdfResponse.ok) throw new Error('Failed to fetch PDF');
      
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const pdfText = await extractTextFromPDF(pdfBuffer);

      console.log(`Extracted ${pdfText.length} characters from PDF`);

      // Split into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 900,
        chunkOverlap: 150,
        separators: ["\n\n", "\n", ". ", " ", ""],
      });

      const docs = await splitter.createDocuments([pdfText]);
      console.log(`Created ${docs.length} chunks`);

      // Process chunks in batches
      const batchSize = 10;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);
        
        // Generate embeddings for batch
        const embeddings = await generateEmbeddings(
          batch.map(d => d.pageContent),
          lovableApiKey
        );

        // Insert chunks with embeddings
        const chunks = batch.map((doc, idx) => ({
          doc_id: docId,
          chunk_index: i + idx,
          text: doc.pageContent,
          embedding: embeddings[idx],
        }));

        const { error: chunkError } = await supabase
          .from('kb_chunks')
          .insert(chunks);

        if (chunkError) throw chunkError;

        console.log(`Inserted batch ${i / batchSize + 1} of ${Math.ceil(docs.length / batchSize)}`);
      }

      // Mark job as completed
      await supabase
        .from('kb_ingest_jobs')
        .update({
          status: 'completed',
          finished_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      return new Response(
        JSON.stringify({
          success: true,
          docId,
          chunksCreated: docs.length,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      // Mark job as failed
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
    console.error('Error ingesting PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Simple PDF text extraction using PDF.js-like approach
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  // For now, we'll use a simple approach
  // In production, you'd want to use a proper PDF parser
  const decoder = new TextDecoder();
  const text = decoder.decode(buffer);
  
  // Extract text between stream and endstream markers (simplified)
  const textMatches = text.match(/BT\s+(.*?)\s+ET/gs) || [];
  const extractedText = textMatches
    .map(match => {
      // Remove PDF operators and extract text
      return match
        .replace(/BT|ET|Tf|Td|Tj|TJ|'|"/g, '')
        .replace(/[\(\)]/g, '')
        .trim();
    })
    .filter(t => t.length > 0)
    .join('\n');

  return extractedText || "Unable to extract text from PDF. Please ensure the PDF contains extractable text.";
}

async function generateEmbeddings(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${error}`);
  }

  const data = await response.json();
  return data.data.map((item: any) => item.embedding);
}
