import { useEffect, useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, Calendar, Database, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BackupRun {
  id: string;
  org_id: string;
  status: 'ok' | 'failed' | 'running';
  file_url: string | null;
  started_at: string;
  finished_at: string | null;
  tables_count: number;
  rows_count: number;
  notes: string | null;
}

export function BackupRuns() {
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (organization?.id) {
      loadBackupRuns();
    }
  }, [organization?.id]);

  const loadBackupRuns = async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('backup_runs')
        .select('*')
        .eq('org_id', organization.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      setRuns((data || []) as BackupRun[]);
    } catch (error: any) {
      toast({
        title: "Error loading backup runs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runBackupNow = async () => {
    setRunning(true);
    try {
      const { error } = await supabase.functions.invoke('run-backup', {
        body: { manual: true },
      });

      if (error) throw error;

      toast({
        title: "Backup started",
        description: "The backup process has been initiated.",
      });

      // Reload runs after a delay
      setTimeout(loadBackupRuns, 3000);
    } catch (error: any) {
      toast({
        title: "Error starting backup",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  const filteredRuns = runs.filter(run => {
    const matchesStatus = statusFilter === "all" || run.status === statusFilter;
    const matchesSearch = !searchTerm || 
      run.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Backup History</CardTitle>
            <CardDescription>
              View and download past backup runs
            </CardDescription>
          </div>
          <Button 
            onClick={runBackupNow} 
            disabled={running || loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
            Run Backup Now
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search backups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ok">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading backup history...
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No backup runs found
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRuns.map((run) => (
                <div
                  key={run.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(run.status)}
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(run.started_at), 'PPp')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          {run.tables_count} tables
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {run.rows_count.toLocaleString()} rows
                        </span>
                        {run.finished_at && (
                          <span>
                            Duration: {Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s
                          </span>
                        )}
                      </div>

                      {run.notes && (
                        <p className="text-sm text-muted-foreground">
                          {run.notes}
                        </p>
                      )}
                    </div>

                    {run.file_url && run.status === 'ok' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(run.file_url!, '_blank')}
                        className="ml-4"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
