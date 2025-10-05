import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileArchive, Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { useRateLimit, RATE_LIMITS } from "@/hooks/useRateLimit";
import { format } from "date-fns";

interface ExportRequest {
  id: string;
  status: string;
  file_url: string | null;
  error_message: string | null;
  created_at: string;
  finished_at: string | null;
}

export function DataExport() {
  const [exports, setExports] = useState<ExportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const { toast } = useToast();
  const { organization } = useOrganization();
  const { executeWithRateLimit, isRateLimited } = useRateLimit();

  useEffect(() => {
    if (organization) {
      loadExports();
    }
  }, [organization]);

  const loadExports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("data_export_requests")
        .select("*")
        .eq("org_id", organization?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setExports(data || []);
    } catch (error: any) {
      console.error("Error loading exports:", error);
      toast({
        title: "Error",
        description: "Failed to load export history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestExport = async () => {
    if (!organization) return;

    // Execute with rate limiting
    const result = await executeWithRateLimit(
      'data_export',
      async () => {
        try {
          setRequesting(true);
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return null;

          // Create export request
          const { data: request, error: insertError } = await supabase
            .from("data_export_requests")
            .insert({
              org_id: organization.id,
              requested_by: session.user.id,
              status: "pending",
            })
            .select()
            .single();

          if (insertError) throw insertError;

          // Trigger export edge function
          const { error: functionError } = await supabase.functions.invoke("export-org-data", {
            body: {
              org_id: organization.id,
              request_id: request.id,
            },
          });

          if (functionError) throw functionError;

          toast({
            title: "Export Started",
            description: "Your data export is being processed. This may take a few moments.",
          });

          // Reload exports after a short delay
          setTimeout(() => {
            loadExports();
          }, 2000);

          return true;
        } catch (error: any) {
          console.error("Error requesting export:", error);
          toast({
            title: "Export Failed",
            description: error.message || "Failed to request data export",
            variant: "destructive",
          });
          return null;
        } finally {
          setRequesting(false);
        }
      },
      RATE_LIMITS.DATA_EXPORT.maxRequests,
      RATE_LIMITS.DATA_EXPORT.timeWindow
    );
  };

  const downloadExport = async (fileUrl: string) => {
    try {
      // Get list of files in the folder
      const { data: files, error: listError } = await supabase.storage
        .from('data-exports')
        .list(fileUrl);

      if (listError) throw listError;

      if (!files || files.length === 0) {
        throw new Error("No files found in export");
      }

      // Create signed URLs for all files
      const downloadPromises = files.map(async (file) => {
        const { data } = await supabase.storage
          .from('data-exports')
          .createSignedUrl(`${fileUrl}/${file.name}`, 3600);
        
        if (data?.signedUrl) {
          // Download each file
          const link = document.createElement('a');
          link.href = data.signedUrl;
          link.download = file.name;
          link.click();
        }
      });

      await Promise.all(downloadPromises);

      toast({
        title: "Download Started",
        description: `Downloading ${files.length} file(s) from your export`,
      });

    } catch (error: any) {
      console.error("Error downloading export:", error);
      toast({
        title: "Error",
        description: "Failed to download export files",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>
              Download all your organization's data for backup or migration purposes
            </CardDescription>
          </div>
          <Button onClick={requestExport} disabled={requesting || !organization}>
            {requesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileArchive className="mr-2 h-4 w-4" />
                Request Export
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Your export will include data from the following tables:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Invoices (sales and purchases)</li>
              <li>Expenses and receipts</li>
              <li>VAT returns</li>
              <li>PIT profiles and calculations</li>
              <li>CIT calculations</li>
              <li>Document metadata</li>
              <li>Audit logs</li>
            </ul>
            <p className="pt-2">
              Data is exported in CSV format for easy importing into other systems.
              Your export will be available for download for 1 hour after generation.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : exports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No exports yet. Click "Request Export" to create your first data export.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map((exportReq) => (
                  <TableRow key={exportReq.id}>
                    <TableCell>{getStatusBadge(exportReq.status)}</TableCell>
                    <TableCell>
                      {format(new Date(exportReq.created_at), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      {exportReq.finished_at
                        ? format(new Date(exportReq.finished_at), "MMM dd, yyyy HH:mm")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {exportReq.status === "ready" && exportReq.file_url ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadExport(exportReq.file_url!)}
                        >
                          <Download className="mr-2 h-3 w-3" />
                          Download
                        </Button>
                      ) : exportReq.status === "failed" ? (
                        <span className="text-xs text-destructive">
                          {exportReq.error_message || "Export failed"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}