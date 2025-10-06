import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, Clock, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { useAdmin } from "@/hooks/useAdmin";

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  details: any;
  created_at: string;
  age_hours: number;
}

export function SecurityAlerts() {
  const { isAdmin } = useAdmin();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_unresolved_security_alerts");
      
      if (error) throw error;
      
      setAlerts(data || []);
    } catch (error: any) {
      console.error("Error fetching security alerts:", error);
      toast.error("Failed to load security alerts");
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async () => {
    if (!selectedAlert) return;

    try {
      setResolving(true);
      const { error } = await supabase.rpc("resolve_security_alert", {
        _alert_id: selectedAlert.id,
        _resolution_notes: resolutionNotes || null,
      });
      
      if (error) throw error;
      
      toast.success("Security alert resolved");
      setSelectedAlert(null);
      setResolutionNotes("");
      fetchAlerts();
    } catch (error: any) {
      console.error("Error resolving alert:", error);
      toast.error("Failed to resolve security alert");
    } finally {
      setResolving(false);
    }
  };

  const runAutomatedChecks = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc("run_automated_security_checks");
      
      if (error) throw error;
      
      toast.success("Automated security checks completed");
      fetchAlerts();
    } catch (error: any) {
      console.error("Error running automated checks:", error);
      toast.error("Failed to run automated security checks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAlerts();
      
      // Subscribe to new alerts
      const channel = supabase
        .channel("security-alerts")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "security_alerts",
          },
          () => {
            fetchAlerts();
            toast.warning("New security alert received");
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You must be an administrator to view security alerts.
        </AlertDescription>
      </Alert>
    );
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      critical: "destructive",
      high: "destructive",
      medium: "default",
      low: "secondary",
    };
    return variants[severity] || "outline";
  };

  const criticalAlerts = alerts.filter(a => a.severity === "critical").length;
  const highAlerts = alerts.filter(a => a.severity === "high").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Security Alerts
          </h2>
          <p className="text-muted-foreground">
            Active security alerts requiring attention
          </p>
        </div>
        <Button onClick={runAutomatedChecks} disabled={loading}>
          Run Security Checks
        </Button>
      </div>

      {/* Alert Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-destructive">
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalAlerts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-600">
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highAlerts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Security Alerts</CardTitle>
          <CardDescription>
            Unresolved security issues requiring investigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading alerts...
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-lg font-semibold">No Active Alerts</p>
              <p className="text-sm text-muted-foreground">
                All security checks are passing
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Badge variant={getSeverityBadge(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{alert.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {alert.alert_type.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        Resolve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Resolution Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolve Security Alert</DialogTitle>
            <DialogDescription>
              Review the alert details and provide resolution notes
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getSeverityBadge(selectedAlert.severity)}>
                    {selectedAlert.severity}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(selectedAlert.created_at), "PPpp")}
                  </span>
                </div>
                <h4 className="font-semibold text-lg">{selectedAlert.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedAlert.description}
                </p>
              </div>

              {selectedAlert.details && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(selectedAlert.details, null, 2)}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="resolution-notes">Resolution Notes (Optional)</Label>
                <Textarea
                  id="resolution-notes"
                  placeholder="Describe how this alert was resolved..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedAlert(null)}
              disabled={resolving}
            >
              Cancel
            </Button>
            <Button onClick={resolveAlert} disabled={resolving}>
              {resolving ? "Resolving..." : "Mark as Resolved"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
