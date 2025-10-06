import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "./EmptyState";

interface Engagement {
  id: string;
  scope: string | null;
  escrow_status: string | null;
  client?: {
    profile?: {
      name: string;
    };
    business?: {
      name: string;
    };
  };
}

interface WorkInProgressListProps {
  engagements: Engagement[];
  loading: boolean;
}

export const WorkInProgressList = ({ engagements, loading }: WorkInProgressListProps) => {
  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading work items...</div>;
  }

  // Only show engagements that are funded or partially funded (active work)
  const activeWork = engagements.filter(
    (e) => e.escrow_status === "funded" || e.escrow_status === "partial"
  );

  if (activeWork.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No active work"
        description="You'll see active engagements here once clients fund them"
      />
    );
  }

  return (
    <div className="space-y-4">
      {activeWork.map((engagement) => {
        const clientName = engagement.client?.profile?.name || 
                         engagement.client?.business?.name || 
                         "Unknown Client";
        
        return (
          <Card key={engagement.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{clientName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {engagement.scope || "No scope defined"}
                  </p>
                </div>
                <Badge variant={engagement.escrow_status === "funded" ? "default" : "secondary"}>
                  {engagement.escrow_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <span>In Progress</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  Track detailed tasks and deliverables here
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
