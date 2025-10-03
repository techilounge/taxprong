import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileText, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";

interface KBDoc {
  id: string;
  title: string;
  file_url: string;
  source_url: string | null;
  created_at: string;
  chunk_count?: number;
}

interface IngestJob {
  id: string;
  status: string;
  file_url: string;
  error_message: string | null;
  created_at: string;
  finished_at: string | null;
}

export default function Knowledge() {
  const [docs, setDocs] = useState<KBDoc[]>([]);
  const [jobs, setJobs] = useState<IngestJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { organization } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [organization]);

  const loadData = async () => {
    if (!organization) return;

    try {
      setLoading(true);

      // Load documents
      const { data: docsData, error: docsError } = await supabase
        .from("kb_docs")
        .select("*")
        .order("created_at", { ascending: false });

      if (docsError) throw docsError;

      // Load chunk counts for each doc
      const docsWithCounts = await Promise.all(
        (docsData || []).map(async (doc) => {
          const { count } = await supabase
            .from("kb_chunks")
            .select("*", { count: "exact", head: true })
            .eq("doc_id", doc.id);
          return { ...doc, chunk_count: count || 0 };
        })
      );

      setDocs(docsWithCounts);

      // Load ingest jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("kb_ingest_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);
    } catch (error: any) {
      console.error("Error loading knowledge base:", error);
      toast({
        title: "Error",
        description: "Failed to load knowledge base",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim() || !organization) {
      toast({
        title: "Error",
        description: "Please provide a title and select a PDF file",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Upload file to storage (you'll need to create a bucket first)
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("knowledge-base")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("knowledge-base")
        .getPublicUrl(fileName);

      // Create document record
      const { data: doc, error: docError } = await supabase
        .from("kb_docs")
        .insert({
          org_id: organization.id,
          title: title,
          file_url: publicUrl,
          uploaded_by: session.user.id,
        })
        .select()
        .single();

      if (docError) throw docError;

      // Trigger ingestion
      const { error: ingestError } = await supabase.functions.invoke("ingest-pdf", {
        body: {
          docId: doc.id,
          fileUrl: publicUrl,
        },
      });

      if (ingestError) throw ingestError;

      toast({
        title: "Success",
        description: "Document uploaded and ingestion started",
      });

      setTitle("");
      setFile(null);
      loadData();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "processing":
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Upload and manage Nigeria tax reference documents
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Tax Document
            </CardTitle>
            <CardDescription>
              Upload PDF documents to create a searchable knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., VAT Act 2025"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">PDF File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <Button onClick={handleUpload} disabled={uploading || !file || !title}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Ingest
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Uploaded knowledge base documents</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : docs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No documents uploaded yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Chunks</TableHead>
                    <TableHead>Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {doc.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{doc.chunk_count || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingest Jobs</CardTitle>
            <CardDescription>Recent document processing jobs</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No ingest jobs yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Finished</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-sm truncate max-w-xs">
                        {job.file_url.split('/').pop()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(job.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {job.finished_at
                          ? new Date(job.finished_at).toLocaleString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
