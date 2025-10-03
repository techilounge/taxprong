import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface SavedReport {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  profiles: {
    name: string;
  };
}

interface Props {
  orgId: string;
  onReportSelect: (report: SavedReport) => void;
}

export function SavedReportsList({ orgId, onReportSelect }: Props) {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
  }, [orgId]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Get reports
      const { data: reportsData, error: reportsError } = await supabase
        .from("saved_reports")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (reportsError) throw reportsError;

      // Get creator profiles
      const creatorIds = reportsData?.map(r => r.created_by) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", creatorIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

      const enrichedReports = reportsData?.map(report => ({
        ...report,
        profiles: profilesMap.get(report.created_by) || { name: 'Unknown' },
      })) || [];

      setReports(enrichedReports as any);
    } catch (error) {
      console.error("Error loading saved reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from("saved_reports")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report deleted successfully",
      });

      loadReports();
    } catch (error: any) {
      console.error("Error deleting report:", error);
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Reports</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Reports</CardTitle>
        <CardDescription>Quick access to your saved analytics views</CardDescription>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No saved reports yet. Click "Save Report" to create one.
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => onReportSelect(report)}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{report.name}</div>
                    {report.description && (
                      <div className="text-sm text-muted-foreground">{report.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Created by {report.profiles.name} on {format(new Date(report.created_at), "MMM dd, yyyy")}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDelete(report.id, e)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
