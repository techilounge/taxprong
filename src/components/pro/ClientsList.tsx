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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Engagements</TableHead>
          <TableHead>Added</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => {
          const clientName = client.profile?.name || client.business?.name || "Unknown";
          const clientType = client.profile ? "Individual" : "Business";
          
          return (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{clientName}</TableCell>
              <TableCell>{clientType}</TableCell>
              <TableCell>
                <Badge variant={client.status === "active" ? "default" : "secondary"}>
                  {client.status}
                </Badge>
              </TableCell>
              <TableCell>{client.engagements_count || 0}</TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(client.created_at), "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
