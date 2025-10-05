import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Upload, FileText, Clock, CheckCircle, XCircle, Loader2, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { format } from "date-fns";

interface KBDoc {
  id: string;
  title: string;
  source_url: string | null;
  file_url: string;
  created_at: string;
  chunk_count?: number;
}

interface IngestJob {
  id: string;
  status: string;
  error_message: string | null;
  created_at: string;
  finished_at: string | null;
  doc_id: string;
  progress: number | null;
}

export default function Knowledge() {
  const [docs, setDocs] = useState<KBDoc[]>([]);
  const [jobs, setJobs] = useState<IngestJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const { toast } = useToast();
  const { organization } = useOrganization();

  useEffect(() => {
    loadData();
  }, [organization]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: docsData, error: docsError } = await supabase
        .from("kb_docs")
        .select("*")
        .order("created_at", { ascending: false });

      if (docsError) throw docsError;

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

      const { data: jobsData, error: jobsError } = await supabase
        .from("kb_ingest_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);
    } catch (error: any) {
      console.error("Error loading knowledge base:", error);
      toast({ title: "Error", description: "Failed to load knowledge base", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim() || !organization) {
      toast({ title: "Error", description: "Please provide a title and select a file", variant: "destructive" });
      return;
    }

    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Upload file to storage
      const fileName = `${session.user.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("kb-documents")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("kb-documents")
        .getPublicUrl(fileName);

      const { data: doc, error: docError } = await supabase
        .from("kb_docs")
        .insert({
          org_id: organization.id,
          title: title,
          source_url: sourceUrl || null,
          file_url: publicUrl,
          uploaded_by: session.user.id,
        })
        .select()
        .single();

      if (docError) throw docError;

      const { error: functionError } = await supabase.functions.invoke("ingest-kb-doc", {
        body: { docId: doc.id },
      });

      if (functionError) throw functionError;

      toast({ title: "Success", description: "Document uploaded and ingestion started" });
      setDialogOpen(false);
      setTitle("");
      setSourceUrl("");
      setFile(null);
      loadData();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast({ title: "Error", description: "Failed to upload document", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, fileUrl: string) => {
    try {
      setDeletingDocId(docId);

      // Extract file path from URL
      const urlParts = fileUrl.split("/kb-documents/");
      if (urlParts.length === 2) {
        const filePath = urlParts[1].split("?")[0]; // Remove query params
        
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from("kb-documents")
          .remove([filePath]);

        if (storageError) {
          console.error("Storage deletion error:", storageError);
          // Continue with DB deletion even if storage fails
        }
      }

      // Delete from database (cascades to chunks and ingest jobs)
      const { error: dbError } = await supabase
        .from("kb_docs")
        .delete()
        .eq("id", docId);

      if (dbError) throw dbError;

      toast({ title: "Success", description: "Document deleted successfully" });
      loadData();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
    } finally {
      setDeletingDocId(null);
    }
  };

  const getStatusBadge = (status: string, progress: number | null) => {
    switch (status) {
      case "completed":
        return (
          <div className="space-y-1">
            <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
            <Progress value={100} className="h-1.5 w-24" />
          </div>
        );
      case "processing":
        return (
          <div className="space-y-1">
            <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing {progress || 0}%</Badge>
            <Progress value={progress || 0} className="h-1.5 w-24" />
          </div>
        );
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Knowledge Base</h1>
            <p className="text-muted-foreground">Manage Nigeria tax documentation and references</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Upload className="mr-2 h-4 w-4" />Upload PDF</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Tax Document</DialogTitle>
                <DialogDescription>Upload a PDF to add it to the knowledge base</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Document Title</Label>
                  <Input id="title" placeholder="e.g., Nigeria VAT Guidelines 2025" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source URL (Optional)</Label>
                  <Input id="source" type="url" placeholder="https://..." value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">PDF File</Label>
                  <Input id="file" type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpload} disabled={uploading}>
                    {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : "Upload"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Tax documents in the knowledge base</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : docs.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">No documents uploaded yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Chunks</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium"><FileText className="inline h-4 w-4 mr-2" />{doc.title}</TableCell>
                      <TableCell><Badge variant="secondary">{doc.chunk_count || 0} chunks</Badge></TableCell>
                      <TableCell>{format(new Date(doc.created_at), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{doc.source_url ? <a href={doc.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View</a> : "-"}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={deletingDocId === doc.id}>
                              {deletingDocId === doc.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{doc.title}" and all its chunks from the knowledge base. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(doc.id, doc.file_url)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
            <CardTitle>Ingestion Jobs</CardTitle>
            <CardDescription>Recent document processing jobs</CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">No ingestion jobs yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Finished</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>{getStatusBadge(job.status, job.progress)}</TableCell>
                      <TableCell>{format(new Date(job.created_at), "MMM dd, HH:mm")}</TableCell>
                      <TableCell>{job.finished_at ? format(new Date(job.finished_at), "MMM dd, HH:mm") : "-"}</TableCell>
                      <TableCell className="text-destructive">{job.error_message || "-"}</TableCell>
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
