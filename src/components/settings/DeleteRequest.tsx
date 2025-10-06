import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";

export function DeleteRequest() {
  const [scope, setScope] = useState<'user' | 'org' | 'engagement'>('user');
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { organization } = useOrganization();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the deletion request",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let scopeRef = session.user.id;
      if (scope === 'org' && organization) {
        scopeRef = organization.id;
      }

      const { error } = await supabase
        .from("delete_requests")
        .insert({
          scope,
          scope_ref: scopeRef,
          requested_by: session.user.id,
          reason,
          status: 'pending',
        });

      if (error) throw error;

      // Get user profile for email notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("id", session.user.id)
        .single();

      // Get the inserted request
      const { data: insertedRequest } = await supabase
        .from("delete_requests")
        .select("*")
        .eq("requested_by", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Send email notification via edge function
      if (insertedRequest && profile) {
        await supabase.functions.invoke("notify-delete-request", {
          body: {
            request: {
              ...insertedRequest,
              user_email: profile.email,
              user_name: profile.name,
            },
          },
        });
      }

      toast({
        title: "Request Submitted",
        description: "Your deletion request has been submitted for admin review",
      });

      setReason("");
    } catch (error: any) {
      console.error("Error submitting delete request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit delete request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-destructive mt-1" />
          <div>
            <CardTitle>Request Data Deletion</CardTitle>
            <CardDescription>
              Submit a request to delete or anonymize your data. This action requires admin approval.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Deletion Scope
          </label>
          <Select value={scope} onValueChange={(v: any) => setScope(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">My User Account</SelectItem>
              <SelectItem value="org">My Organization</SelectItem>
              <SelectItem value="engagement">Specific Engagement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Reason for Deletion
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please explain why you want to delete this data..."
            rows={4}
          />
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
          <p className="font-medium">What will happen:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            {scope === 'user' && (
              <>
                <li>Your personal information will be anonymized</li>
                <li>Numerical records will be retained for legal compliance</li>
                <li>Your account will be marked as deleted</li>
              </>
            )}
            {scope === 'org' && (
              <>
                <li>Organization data will be tombstoned</li>
                <li>PII will be scrubbed from records</li>
                <li>Audit logs will be preserved</li>
              </>
            )}
            {scope === 'engagement' && (
              <>
                <li>Messages and files will be removed</li>
                <li>Numeric aggregates will be kept</li>
                <li>Party information will be unlinked</li>
              </>
            )}
          </ul>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting || !reason.trim()}
          variant="destructive"
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Deletion Request"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
