import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle, Activity, Users, FileArchive, Lock } from "lucide-react";
import { useSecurityMonitor } from "@/hooks/useSecurityMonitor";
import { format } from "date-fns";
import { toast } from "sonner";

export function SecurityMonitor() {
  const {
    summary,
    events,
    loading,
    fetchSummary,
    subscribeToHighSeverityEvents,
    getSeverityColor,
    formatEventType,
    isAdmin,
  } = useSecurityMonitor();

  const [selectedTimeRange, setSelectedTimeRange] = useState(7);

  useEffect(() => {
    if (!isAdmin) return;

    // Subscribe to high severity events for real-time alerts
    const unsubscribe = subscribeToHighSeverityEvents((event) => {
      toast.error(
        `Security Alert: ${formatEventType(event.event_type)} - ${event.user_email}`,
        {
          description: `Severity: ${event.severity?.toUpperCase()}`,
        }
      );
    });

    return unsubscribe;
  }, [isAdmin, subscribeToHighSeverityEvents, formatEventType]);

  const handleTimeRangeChange = (days: number) => {
    setSelectedTimeRange(days);
    fetchSummary(days);
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You must be an administrator to view the security monitor.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Security Monitor
        </h2>
        <p className="text-muted-foreground">
          Real-time security events and threat monitoring
        </p>
      </div>

      {/* Security Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : summary?.total_events?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {selectedTimeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              High Severity Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {loading ? "..." : summary?.high_severity_events || 0}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : summary?.unique_users || 0}
            </div>
            <p className="text-xs text-muted-foreground">Unique users active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limits Hit</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : summary?.failed_rate_limits || 0}
            </div>
            <p className="text-xs text-muted-foreground">Blocked attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TIN Accesses</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : summary?.tin_accesses || 0}
            </div>
            <p className="text-xs text-muted-foreground">Sensitive data views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Exports</CardTitle>
            <FileArchive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : summary?.data_exports || 0}
            </div>
            <p className="text-xs text-muted-foreground">Export requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <Tabs defaultValue="7" onValueChange={(v) => handleTimeRangeChange(parseInt(v))}>
        <TabsList>
          <TabsTrigger value="1">Last 24h</TabsTrigger>
          <TabsTrigger value="7">Last 7 days</TabsTrigger>
          <TabsTrigger value="30">Last 30 days</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Security Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>
            Detailed log of security-relevant activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No security events found
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(event.time), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell>{formatEventType(event.event_type)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{event.user_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {event.user_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(event.severity) as any}>
                        {event.severity || "low"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {event.action} on {event.entity}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
