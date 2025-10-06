import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, PlayCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MaintenanceTask {
  id: string;
  task_name: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  details: any;
  error_message: string | null;
  duration_seconds: number;
}

export function MaintenanceMonitor() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase.rpc('get_maintenance_task_history', {
        _days: 7
      });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error fetching maintenance tasks:', error);
      toast.error('Failed to load maintenance history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const runTask = async (taskName: string) => {
    setRunning(taskName);
    try {
      const { data, error } = await supabase.rpc(taskName as any);

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        toast.success(`Task completed: ${taskName}`);
      } else {
        toast.error(`Task failed: ${result.error}`);
      }

      // Refresh the task list
      await fetchTasks();
    } catch (error: any) {
      console.error('Error running task:', error);
      toast.error(error.message || 'Failed to run maintenance task');
    } finally {
      setRunning(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      failed: "destructive",
      running: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Tasks</CardTitle>
          <CardDescription>
            Run and monitor automated maintenance tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Button
              onClick={() => runTask('cleanup_old_audit_logs')}
              disabled={running !== null}
              className="justify-start"
            >
              {running === 'cleanup_old_audit_logs' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="mr-2 h-4 w-4" />
              )}
              Cleanup Old Audit Logs (90+ days)
            </Button>
            <Button
              onClick={() => runTask('cleanup_old_security_alerts')}
              disabled={running !== null}
              className="justify-start"
            >
              {running === 'cleanup_old_security_alerts' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="mr-2 h-4 w-4" />
              )}
              Cleanup Old Security Alerts (30+ days)
            </Button>
            <Button
              onClick={() => runTask('verify_backup_health')}
              disabled={running !== null}
              className="justify-start"
            >
              {running === 'verify_backup_health' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="mr-2 h-4 w-4" />
              )}
              Verify Backup Health
            </Button>
            <Button
              onClick={() => runTask('run_automated_security_checks')}
              disabled={running !== null}
              className="justify-start"
            >
              {running === 'run_automated_security_checks' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="mr-2 h-4 w-4" />
              )}
              Run Security Checks
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task History (Last 7 Days)</CardTitle>
          <CardDescription>
            View recent maintenance task executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No maintenance tasks run in the last 7 days</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="mt-1">
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{task.task_name}</p>
                        {getStatusBadge(task.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Started: {new Date(task.started_at).toLocaleString()}</p>
                        {task.finished_at && (
                          <p>Duration: {formatDuration(task.duration_seconds)}</p>
                        )}
                        {task.details && Object.keys(task.details).length > 0 && (
                          <p>Details: {JSON.stringify(task.details)}</p>
                        )}
                        {task.error_message && (
                          <p className="text-destructive">Error: {task.error_message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}