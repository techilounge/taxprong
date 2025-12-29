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
        return <Badge variant="default" className="text-xs">Paid</Badge>;
      case "pending":
        return <Badge variant="secondary" className="text-xs">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardDescription className="text-xs sm:text-sm">Total Billed</CardDescription>
            <CardTitle className="text-lg sm:text-2xl">₦{stats.totalBilled.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardDescription className="text-xs sm:text-sm">Total Paid</CardDescription>
            <CardTitle className="text-lg sm:text-2xl text-green-600">
              ₦{stats.totalPaid.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardDescription className="text-xs sm:text-sm">Outstanding</CardDescription>
            <CardTitle className="text-lg sm:text-2xl text-orange-600">
              ₦{stats.outstanding.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardDescription className="text-xs sm:text-sm">Platform Fees</CardDescription>
            <CardTitle className="text-lg sm:text-2xl">₦{stats.platformFees.toLocaleString()}</CardTitle>
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
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Client</TableHead>
                    <TableHead className="hidden md:table-cell">Scope</TableHead>
                    <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                    <TableHead className="hidden lg:table-cell">Payout</TableHead>
                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const clientName = invoice.engagement?.client?.profile?.name || 
                                     invoice.engagement?.client?.business?.name || 
                                     "Unknown";
                    
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium text-xs sm:text-sm max-w-[100px] sm:max-w-[150px] truncate">{clientName}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs sm:text-sm max-w-[120px] truncate">{invoice.engagement?.scope || "—"}</TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">₦{invoice.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-green-600 hidden lg:table-cell text-xs sm:text-sm">
                          ₦{(invoice.pro_payout_amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell text-xs sm:text-sm">
                          {format(new Date(invoice.created_at), "MMM d")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
