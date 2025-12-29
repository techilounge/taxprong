import { Users, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useState } from "react";
import { AddClientDialog } from "./AddClientDialog";

interface Client {
  id: string;
  status: string;
  created_at: string;
  profile?: {
    name: string;
    email: string;
  };
  business?: {
    name: string;
  };
  engagements_count?: number;
}

interface ClientsListProps {
  clients: Client[];
  loading: boolean;
  onAddClient: () => void;
}

export const ClientsList = ({ clients, loading, onAddClient }: ClientsListProps) => {
  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading clients...</div>;
  }

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No clients yet"
        description="Start building your practice by adding your first client"
        actionLabel="Add Client"
        onAction={onAddClient}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs sm:text-sm">Client Name</TableHead>
            <TableHead className="hidden sm:table-cell">Type</TableHead>
            <TableHead className="text-xs sm:text-sm">Status</TableHead>
            <TableHead className="hidden md:table-cell">Engagements</TableHead>
            <TableHead className="hidden sm:table-cell">Added</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const clientName = client.profile?.name || client.business?.name || "Unknown";
            const clientType = client.profile ? "Individual" : "Business";
            
            return (
              <TableRow key={client.id}>
                <TableCell className="font-medium text-xs sm:text-sm max-w-[120px] sm:max-w-[200px] truncate">{clientName}</TableCell>
                <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{clientType}</TableCell>
                <TableCell>
                  <Badge variant={client.status === "active" ? "default" : "secondary"} className="text-xs">
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs sm:text-sm">{client.engagements_count || 0}</TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell text-xs sm:text-sm">
                  {format(new Date(client.created_at), "MMM d")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
