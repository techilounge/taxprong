import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Download, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrganization } from "@/hooks/useOrganization";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { format } from "date-fns";

interface Expense {
  id: string;
  date: string;
  merchant: string;
  description?: string;
  amount: number;
  vat_amount?: number;
  category: string;
  flags_json?: any;
}

const Expenses = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { organization } = useOrganization();

  const [stats, setStats] = useState({
    totalExpenses: 0,
    vatRecoverable: 0,
    pendingReview: 0,
  });

  useEffect(() => {
    if (organization) {
      loadExpenses();
    }
  }, [organization]);

  const loadExpenses = async () => {
    if (!organization) return;

    try {
      setLoading(true);

      // Get current month expenses
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("org_id", organization.id)
        .gte("date", startOfMonth)
        .order("date", { ascending: false });

      if (error) throw error;

      setExpenses(data || []);

      // Calculate stats
      const total = data?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const vatRecoverable = data?.reduce((sum, exp) => {
        const vat = Number(exp.vat_amount || 0);
        const pct = Number(exp.vat_recoverable_pct || 100);
        return sum + (vat * pct / 100);
      }, 0) || 0;
      const pending = data?.filter((exp) => {
        const flags = exp.flags_json as any;
        return flags?.needs_review;
      }).length || 0;

      setStats({
        totalExpenses: total,
        vatRecoverable,
        pendingReview: pending,
      });
    } catch (error: any) {
      console.error("Error loading expenses:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(
    (exp) =>
      exp.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expense Tracker</h1>
            <p className="text-muted-foreground">
              Track business expenses and manage VAT recovery
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!organization}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                  <DialogDescription>
                    Record a business expense with receipt upload
                  </DialogDescription>
                </DialogHeader>
                {organization && (
                  <ExpenseForm
                    orgId={organization.id}
                    onSuccess={() => {
                      setDialogOpen(false);
                      loadExpenses();
                    }}
                    onCancel={() => setDialogOpen(false)}
                  />
                )}
              </DialogContent>
            </Dialog>
            
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{stats.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">VAT Recoverable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{stats.vatRecoverable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Input VAT</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReview}</div>
              <p className="text-xs text-muted-foreground mt-1">Expenses to categorize</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>View and manage all business expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">VAT</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading expenses...
                    </TableCell>
                  </TableRow>
                ) : filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm
                        ? "No expenses match your search."
                        : "No expenses recorded yet. Add your first expense to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{expense.merchant}</TableCell>
                      <TableCell>{expense.description || "-"}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className="text-right">
                        ₦{Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        {expense.vat_amount
                          ? `₦${Number(expense.vat_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const flags = expense.flags_json as any;
                          return flags?.needs_review ? (
                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Review
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-accent/10 text-accent border-accent">
                              OK
                            </Badge>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Expenses;
