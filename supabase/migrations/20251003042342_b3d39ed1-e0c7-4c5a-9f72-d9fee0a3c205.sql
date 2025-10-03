-- Create function for vector similarity search on kb_chunks
CREATE OR REPLACE FUNCTION public.match_kb_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 8,
  filter_org_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  doc_id uuid,
  chunk_index int,
  text text,
  score float,
  doc_title text
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.doc_id,
    c.chunk_index,
    c.text,
    1 - (c.embedding <=> query_embedding) as score,
    d.title as doc_title
  FROM kb_chunks c
  JOIN kb_docs d ON c.doc_id = d.id
  WHERE 
    1 - (c.embedding <=> query_embedding) > match_threshold
    AND (filter_org_id IS NULL OR d.org_id IS NULL OR d.org_id = filter_org_id)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;