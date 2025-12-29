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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs sm:text-sm">Client</TableHead>
            <TableHead className="hidden md:table-cell">Scope</TableHead>
            <TableHead className="hidden lg:table-cell">Fee Type</TableHead>
            <TableHead className="text-xs sm:text-sm">Quote</TableHead>
            <TableHead className="text-xs sm:text-sm">Escrow</TableHead>
            <TableHead className="hidden sm:table-cell">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {engagements.map((engagement) => {
            const clientName = engagement.client?.profile?.name || 
                             engagement.client?.business?.name || 
                             "Unknown Client";
            
            return (
              <TableRow key={engagement.id}>
                <TableCell className="font-medium text-xs sm:text-sm max-w-[100px] sm:max-w-[150px] truncate">{clientName}</TableCell>
                <TableCell className="hidden md:table-cell text-xs sm:text-sm max-w-[120px] truncate">{engagement.scope || "—"}</TableCell>
                <TableCell className="hidden lg:table-cell text-xs sm:text-sm capitalize">{engagement.fee_type || "—"}</TableCell>
                <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                  {engagement.quote ? `₦${engagement.quote.toLocaleString()}` : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={getEscrowBadgeVariant(engagement.escrow_status)} className="text-xs">
                    {engagement.escrow_status || "unfunded"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell text-xs sm:text-sm">
                  {format(new Date(engagement.created_at), "MMM d")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
