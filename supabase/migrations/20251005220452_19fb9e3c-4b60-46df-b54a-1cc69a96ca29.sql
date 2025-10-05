-- Create storage bucket for tax documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tax-documents',
  'tax-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf']
);

-- Create generated_documents table
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  period TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'completed',
  document_metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  downloaded_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX idx_generated_documents_org_id ON generated_documents(org_id);
CREATE INDEX idx_generated_documents_business_id ON generated_documents(business_id);
CREATE INDEX idx_generated_documents_template_id ON generated_documents(template_id);
CREATE INDEX idx_generated_documents_created_at ON generated_documents(created_at DESC);

-- RLS Policies for generated_documents
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view generated documents"
ON generated_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM org_users
    WHERE org_users.org_id = generated_documents.org_id
    AND org_users.user_id = auth.uid()
  )
);

CREATE POLICY "Org staff can create generated documents"
ON generated_documents FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM org_users
    WHERE org_users.org_id = generated_documents.org_id
    AND org_users.user_id = auth.uid()
    AND org_users.role IN ('owner', 'staff')
  )
);

CREATE POLICY "Org staff can delete generated documents"
ON generated_documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM org_users
    WHERE org_users.org_id = generated_documents.org_id
    AND org_users.user_id = auth.uid()
    AND org_users.role IN ('owner', 'staff')
  )
);

-- Storage policies for tax-documents bucket
CREATE POLICY "Org members can view their tax documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tax-documents' AND
  EXISTS (
    SELECT 1 FROM generated_documents gd
    JOIN org_users ou ON gd.org_id = ou.org_id
    WHERE gd.file_url = storage.objects.name
    AND ou.user_id = auth.uid()
  )
);

CREATE POLICY "Org staff can upload tax documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tax-documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Org staff can delete tax documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tax-documents' AND
  auth.uid() IS NOT NULL
);