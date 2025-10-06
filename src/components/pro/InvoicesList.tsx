import { Receipt, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface ProInvoice {
  id: string;
  amount: number;
  platform_fee_amount: number | null;
  pro_payout_amount: number | null;
  status: string | null;
  created_at: string;
  engagement?: {
    scope: string | null;
    client?: {
      profile?: {
        name: string;
      };
      business?: {
        name: string;
      };
    };
  };
}

interface InvoicesListProps {
  invoices: ProInvoice[];
  loading: boolean;
  stats: {
    totalBilled: number;
    totalPaid: number;
    outstanding: number;
    platformFees: number;
  };
  onCreateInvoice: () => void;
}

export const InvoicesList = ({ invoices, loading, stats, onCreateInvoice }: InvoicesListProps) => {
  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>;
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "paid":
        return <Badge variant="default">Paid</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Billed</CardDescription>
            <CardTitle className="text-2xl">₦{stats.totalBilled.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Paid</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              ₦{stats.totalPaid.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Outstanding</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              ₦{stats.outstanding.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Platform Fees</CardDescription>
            <CardTitle className="text-2xl">₦{stats.platformFees.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Invoices Table */}
      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Create invoices for completed work to get paid"
          actionLabel="Create Invoice"
          onAction={onCreateInvoice}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Your Payout</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const clientName = invoice.engagement?.client?.profile?.name || 
                                   invoice.engagement?.client?.business?.name || 
                                   "Unknown";
                  
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{clientName}</TableCell>
                      <TableCell>{invoice.engagement?.scope || "—"}</TableCell>
                      <TableCell>₦{invoice.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600">
                        ₦{(invoice.pro_payout_amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(invoice.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
