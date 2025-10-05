import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, org_id, session_id } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    console.log('Generating embedding for query:', query);

    // Step 1: Generate embedding for the query using OpenAI
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-3-small',
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('Embedding API error:', embeddingResponse.status, errorText);
      throw new Error(`Failed to generate embedding: ${errorText}`);
    }

    const embeddingData = await embeddingResponse.json();
    console.log('Embedding generated successfully');
    
    if (!embeddingData || !embeddingData.data || !embeddingData.data[0]) {
      console.error('Invalid embedding response format:', embeddingData);
      throw new Error('Invalid response from embedding API');
    }
    
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log('Query embedding generated, performing vector search');

    // Step 2: Vector search on kb_chunks
    // Filter by org_id if provided (org_id NULL = global, or matching org_id)
    const { data: chunks, error: searchError } = await supabase.rpc('match_kb_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 8,
      filter_org_id: org_id || null,
    });

    if (searchError) {
      // If the RPC doesn't exist, fall back to a simple query
      console.log('RPC not found, using fallback query');
      const { data: allChunks, error: fallbackError } = await supabase
        .from('kb_chunks')
        .select('id, text, chunk_index, doc_id, embedding')
        .limit(100);

      if (fallbackError) throw fallbackError;

      // Manual cosine similarity calculation
      const chunksWithScores = allChunks.map((chunk: any) => {
        const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
        return { ...chunk, score: similarity };
      });

      chunksWithScores.sort((a, b) => b.score - a.score);
      const topChunks = chunksWithScores.slice(0, 8);

      // Get doc titles
      const docIds = [...new Set(topChunks.map(c => c.doc_id))];
      const { data: docs } = await supabase
        .from('kb_docs')
        .select('id, title')
        .in('id', docIds);

      const docMap = new Map(docs?.map(d => [d.id, d.title]) || []);

      const results = topChunks.map(chunk => ({
        text: chunk.text,
        score: chunk.score,
        doc_id: chunk.doc_id,
        chunk_index: chunk.chunk_index,
        doc_title: docMap.get(chunk.doc_id) || 'Unknown Document',
      }));

      console.log(`Found ${results.length} relevant chunks`);

      // Step 3: Build prompt with context
      const context = results
        .map((r, idx) => `[${r.doc_title} §${r.chunk_index}]\n${r.text}`)
        .join('\n\n---\n\n');

      const prompt = `You are a tax expert assistant. Answer the following question using ONLY the information provided in the snippets below. Cite your sources using the format [Document Title §chunk_index].

If you cannot answer the question based on the provided information, say "I don't have enough information to answer this question."

Question: ${query}

Context snippets:
${context}

Provide a clear, accurate answer with citations.`;

      console.log('Calling AI for answer generation');

      // Step 4: Call AI to generate answer
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'user', content: prompt }
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API error:', aiResponse.status, errorText);
        throw new Error(`Failed to generate answer: ${errorText}`);
      }

      const aiData = await aiResponse.json();
      const answer = aiData.choices[0].message.content;

      // Extract citations from the answer
      const citationRegex = /\[([^\]]+?) §(\d+)\]/g;
      const citationsSet = new Set<string>();
      let match;
      
      while ((match = citationRegex.exec(answer)) !== null) {
        citationsSet.add(`${match[1]} §${match[2]}`);
      }

      const citations = Array.from(citationsSet).map(cite => {
        const [title, ref] = cite.split(' §');
        return { title, ref: `§${ref}` };
      });

      console.log('Generated answer with citations:', citations);

      // Step 5: Save to qa_citations with user tracking
      const { error: insertError } = await supabase
        .from('qa_citations')
        .insert({
          session_id: session_id || null,
          question: query,
          answer: answer,
          citations: citations,
          user_id: user.id, // Track which user asked the question
        });

      if (insertError) {
        console.error('Error saving citation:', insertError);
      }

      return new Response(
        JSON.stringify({
          answer,
          citations,
          chunks: results.map(r => ({
            text: r.text,
            score: r.score,
            doc_title: r.doc_title,
            chunk_index: r.chunk_index,
          })),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If RPC exists, use the returned chunks
    console.log(`Found ${chunks?.length || 0} relevant chunks`);

    if (!chunks || chunks.length === 0) {
      return new Response(
        JSON.stringify({
          answer: "I don't have enough information to answer this question.",
          citations: [],
          chunks: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Build prompt with context
    const context = chunks
      .map((r: any, idx: number) => `[${r.doc_title} §${r.chunk_index}]\n${r.text}`)
      .join('\n\n---\n\n');

    const prompt = `You are a tax expert assistant. Answer the following question using ONLY the information provided in the snippets below. Cite your sources using the format [Document Title §chunk_index].

If you cannot answer the question based on the provided information, say "I don't have enough information to answer this question."

Question: ${query}

Context snippets:
${context}

Provide a clear, accurate answer with citations.`;

    console.log('Calling AI for answer generation');

    // Step 4: Call AI to generate answer
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`Failed to generate answer: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices[0].message.content;

    // Extract citations from the answer
    const citationRegex = /\[([^\]]+?) §(\d+)\]/g;
    const citationsSet = new Set<string>();
    let match;
    
    while ((match = citationRegex.exec(answer)) !== null) {
      citationsSet.add(`${match[1]} §${match[2]}`);
    }

    const citations = Array.from(citationsSet).map(cite => {
      const [title, ref] = cite.split(' §');
      return { title, ref: `§${ref}` };
    });

    console.log('Generated answer with citations:', citations);

    // Step 5: Save to qa_citations with user tracking
    const { error: insertError } = await supabase
      .from('qa_citations')
      .insert({
        session_id: session_id || null,
        question: query,
        answer: answer,
        citations: citations,
        user_id: user.id, // Track which user asked the question
      });

    if (insertError) {
      console.error('Error saving citation:', insertError);
    }

    return new Response(
      JSON.stringify({
        answer,
        citations,
        chunks: chunks.map((r: any) => ({
          text: r.text,
          score: r.score,
          doc_title: r.doc_title,
          chunk_index: r.chunk_index,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in answer-with-citations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function for cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}