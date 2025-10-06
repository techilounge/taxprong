import { Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "./EmptyState";
import { format } from "date-fns";

interface Engagement {
  id: string;
  scope: string | null;
  fee_type: string | null;
  quote: number | null;
  escrow_status: string | null;
  created_at: string;
  client?: {
    profile?: {
      name: string;
    };
    business?: {
      name: string;
    };
  };
}

interface EngagementsListProps {
  engagements: Engagement[];
  loading: boolean;
  onNewEngagement: () => void;
}

export const EngagementsList = ({ engagements, loading, onNewEngagement }: EngagementsListProps) => {
  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading engagements...</div>;
  }

  if (engagements.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No engagements yet"
        description="Create your first client engagement to start working"
        actionLabel="New Engagement"
        onAction={onNewEngagement}
      />
    );
  }

  const getEscrowBadgeVariant = (status: string | null) => {
    switch (status) {
      case "funded":
        return "default";
      case "partial":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Scope</TableHead>
          <TableHead>Fee Type</TableHead>
          <TableHead>Quote</TableHead>
          <TableHead>Escrow</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {engagements.map((engagement) => {
          const clientName = engagement.client?.profile?.name || 
                           engagement.client?.business?.name || 
                           "Unknown Client";
          
          return (
            <TableRow key={engagement.id}>
              <TableCell className="font-medium">{clientName}</TableCell>
              <TableCell>{engagement.scope || "—"}</TableCell>
              <TableCell className="capitalize">{engagement.fee_type || "—"}</TableCell>
              <TableCell>
                {engagement.quote ? `₦${engagement.quote.toLocaleString()}` : "—"}
              </TableCell>
              <TableCell>
                <Badge variant={getEscrowBadgeVariant(engagement.escrow_status)}>
                  {engagement.escrow_status || "unfunded"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(engagement.created_at), "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
