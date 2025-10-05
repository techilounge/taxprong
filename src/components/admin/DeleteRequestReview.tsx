import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRateLimit, RATE_LIMITS } from "@/hooks/useRateLimit";
import { format } from "date-fns";

interface DeleteRequest {
  id: string;
  scope: string;
  scope_ref: string;
  status: string;
  reason: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  requested_by: string;
  profiles: {
    name: string;
    email: string;
  };
}

export function DeleteRequestReview() {
  const [requests, setRequests] = useState<DeleteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DeleteRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { executeWithRateLimit, isRateLimited } = useRateLimit();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      
      // Get delete requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("delete_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      // Get profiles for requested_by users
      const userIds = requestsData?.map(r => r.requested_by) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

      const enrichedRequests = requestsData?.map(req => ({
        ...req,
        profiles: profilesMap.get(req.requested_by) || { name: 'Unknown', email: 'Unknown' },
      })) || [];

      setRequests(enrichedRequests as any);
    } catch (error: any) {
      console.error("Error loading delete requests:", error);
      toast({
        title: "Error",
        description: "Failed to load delete requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'deny') => {
    if (!selectedRequest) return;

    // Execute with rate limiting for admin operations
    const result = await executeWithRateLimit(
      'admin_delete_request',
      async () => {
        try {
          setProcessing(true);

          const { error } = await supabase.functions.invoke("process-delete-request", {
            body: {
              request_id: selectedRequest.id,
              action,
              admin_notes: adminNotes,
            },
          });

          if (error) throw error;

          toast({
            title: action === 'approve' ? "Request Approved" : "Request Denied",
            description: `Delete request has been ${action === 'approve' ? 'approved and processed' : 'denied'}`,
          });

          setSelectedRequest(null);
          setAdminNotes("");
          loadRequests();
          
          return true;
        } catch (error: any) {
          console.error("Error processing request:", error);
          toast({
            title: "Error",
            description: error.message || "Failed to process delete request",
            variant: "destructive",
          });
          return null;
        } finally {
          setProcessing(false);
        }
      },
      RATE_LIMITS.ADMIN_OPERATION.maxRequests,
      RATE_LIMITS.ADMIN_OPERATION.timeWindow
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Processed
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Denied
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Delete Requests</CardTitle>
          <CardDescription>
            Review and approve or deny user data deletion requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No delete requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="capitalize">{request.scope}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.profiles?.name}</div>
                        <div className="text-xs text-muted-foreground">{request.profiles?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                    <TableCell>
                      {format(new Date(request.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setAdminNotes(request.admin_notes || "");
                          }}
                        >
                          Review
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Delete Request</DialogTitle>
            <DialogDescription>
              Approve or deny this data deletion request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Request Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Scope:</span>
                    <span className="ml-2 capitalize">{selectedRequest.scope}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Requested by:</span>
                    <span className="ml-2">{selectedRequest.profiles?.name}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Reason:</span>
                    <p className="mt-1">{selectedRequest.reason}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Admin Notes
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this decision..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedRequest(null)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAction('deny')}
              disabled={processing}
            >
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Deny
            </Button>
            <Button
              onClick={() => handleAction('approve')}
              disabled={processing}
            >
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Approve & Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
