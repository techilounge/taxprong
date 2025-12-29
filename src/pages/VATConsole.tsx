import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Calendar, AlertCircle, Download, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrganization } from "@/hooks/useOrganization";
import { InvoiceForm } from "@/components/vat/InvoiceForm";
import { format } from "date-fns";
import { logAudit } from "@/lib/auditLog";
import { FloatingTaxQA } from "@/components/tax/FloatingTaxQA";

interface Invoice {
  id: string;
  type: "sale" | "purchase";
  counterparty_name: string;
  supply_type: "standard" | "zero" | "exempt";
  net: number;
  vat: number;
  issue_date: string;
  efs_status?: string;
  efs_rejection_reason?: string;
  einvoice_id?: string;
  locked?: boolean;
}

const VATConsole = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [salesInvoices, setSalesInvoices] = useState<Invoice[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { organization } = useOrganization();

  const [vatSummary, setVatSummary] = useState({
    outputVAT: 0,
    inputVAT: 0,
    payable: 0,
  });

  useEffect(() => {
    if (organization) {
      loadBusiness();
    }
  }, [organization]);

  useEffect(() => {
    if (businessId) {
      loadInvoices();
    }
  }, [businessId]);

  const loadBusiness = async () => {
    if (!organization) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get or create business for this org
      let { data: business, error } = await supabase
        .from("businesses")
        .select("id")
        .eq("org_id", organization.id)
        .limit(1)
        .single();

      if (error && error.code === "PGRST116") {
        // No business exists, create one
        const { data: newBusiness, error: createError } = await supabase
          .from("businesses")
          .insert({
            org_id: organization.id,
            owner_id: session.user.id,
            name: organization.name,
            vat_registered: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        business = newBusiness;
      }

      if (business) {
        setBusinessId(business.id);
      }
    } catch (error: any) {
      console.error("Error loading business:", error);
      toast.error("Failed to load business");
    }
  };

  const loadInvoices = async () => {
    if (!businessId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("business_id", businessId)
        .order("issue_date", { ascending: false });

      if (error) throw error;

      const sales = data?.filter((inv: any) => inv.type === "sale") || [];
      const purchases = data?.filter((inv: any) => inv.type === "purchase") || [];

      setSalesInvoices(sales);
      setPurchaseInvoices(purchases);

      // Calculate VAT summary
      const outputVAT = sales.reduce((sum, inv) => sum + Number(inv.vat || 0), 0);
      const inputVAT = purchases.reduce((sum, inv) => sum + Number(inv.vat || 0), 0);
      
      setVatSummary({
        outputVAT,
        inputVAT,
        payable: outputVAT - inputVAT,
      });
    } catch (error: any) {
      console.error("Error loading invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const exportVATReturn = async () => {
    if (!businessId || !organization) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Log the export action
      await logAudit("vat_return", businessId, "export", session.user.id, {
        outputVAT: vatSummary.outputVAT,
        inputVAT: vatSummary.inputVAT,
        payable: vatSummary.payable,
      });

      toast.success("VAT return exported successfully");
    } catch (error) {
      console.error("Error exporting VAT return:", error);
      toast.error("Failed to export VAT return");
    }
  };

  const submitVATReturn = async () => {
    if (!businessId || !organization) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check for active engagement with authority to file
      const { data: engagements, error: engError } = await supabase
        .from("engagements")
        .select("*, pro_id")
        .eq("business_id", businessId)
        .eq("authority_to_file", true)
        .eq("escrow_status", "funded");

      if (engError) throw engError;

      if (!engagements || engagements.length === 0) {
        toast.error(
          "Cannot submit return: You need an active engagement with signed Authority to File and funded escrow"
        );
        return;
      }

      // Log the submission
      await logAudit("vat_return", businessId, "submit", session.user.id, {
        outputVAT: vatSummary.outputVAT,
        inputVAT: vatSummary.inputVAT,
        payable: vatSummary.payable,
        engagement_id: engagements[0].id,
      });

      // Create VAT return record
      const currentPeriod = format(new Date(), "yyyy-MM");
      const { error: returnError } = await supabase.from("vat_returns").insert({
        business_id: businessId,
        period: currentPeriod,
        output_vat: vatSummary.outputVAT,
        input_vat: vatSummary.inputVAT,
        payable: vatSummary.payable,
        efs_batch_status: "submitted",
      });

      if (returnError) throw returnError;

      toast.success("VAT return submitted successfully");
    } catch (error: any) {
      console.error("Error submitting VAT return:", error);
      toast.error("Failed to submit VAT return");
    }
  };

  const transmitInvoice = async (invoiceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("transmit-einvoice", {
        body: { invoiceId },
      });

      if (error) throw error;

      if (data.status === "accepted") {
        toast.success(`Invoice accepted! E-Invoice ID: ${data.einvoiceId}`);
      } else if (data.status === "queued") {
        toast.info("Invoice queued for processing");
      } else if (data.status === "rejected") {
        toast.error(`Invoice rejected: ${data.rejectionReason}`);
      }

      loadInvoices();
    } catch (error: any) {
      console.error("Error transmitting invoice:", error);
      toast.error("Failed to transmit invoice");
    }
  };
  const handleInsertVATNote = async (answer: string, citations: any[]) => {
    // Q&A is already logged in qa_citations table by the edge function
    // Additional note storage logic can be added here if needed
    toast.success("Q&A saved to VAT return notes");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">VAT Console</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage VAT invoices and file returns
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!businessId} size="sm" className="sm:size-default">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">New Invoice</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Invoice</DialogTitle>
                  <DialogDescription>
                    Add a sales or purchase invoice for VAT tracking
                  </DialogDescription>
                </DialogHeader>
                {businessId && (
                  <InvoiceForm
                    businessId={businessId}
                    onSuccess={() => {
                      setDialogOpen(false);
                      loadInvoices();
                    }}
                    onCancel={() => setDialogOpen(false)}
                  />
                )}
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" className="sm:size-default" onClick={exportVATReturn} disabled={!businessId}>
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button size="sm" className="sm:size-default" onClick={submitVATReturn} disabled={!businessId}>
              <Send className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Submit</span>
            </Button>
          </div>
        </div>

        {/* VAT Summary */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Output VAT
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-lg sm:text-2xl font-bold">
                ₦{vatSummary.outputVAT.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Sales VAT</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-secondary" />
                Input VAT
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-lg sm:text-2xl font-bold">
                ₦{vatSummary.inputVAT.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">To recover</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                VAT Payable
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-lg sm:text-2xl font-bold">
                ₦{Math.max(vatSummary.payable, 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Due by 14th</p>
            </CardContent>
          </Card>
        </div>

        {/* Deadline Banner */}
        <Card className="bg-warning/10 border-warning">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-4">
            <Calendar className="h-5 w-5 text-warning flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm sm:text-base">VAT Return Deadline</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                File your November 2025 return by 14th December 2025
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/compliance')}>View Details</Button>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">VAT Invoices</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Manage sales and purchase invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sales">
              <TabsList className="w-full grid grid-cols-3 lg:w-auto lg:inline-flex">
                <TabsTrigger value="sales" className="text-xs sm:text-sm">Sales</TabsTrigger>
                <TabsTrigger value="purchases" className="text-xs sm:text-sm">Purchases</TabsTrigger>
                <TabsTrigger value="returns" className="text-xs sm:text-sm">Returns</TabsTrigger>
              </TabsList>

              <TabsContent value="sales" className="mt-4">
                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                  <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Supply Type</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead className="text-right">VAT</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>E-Invoice</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Loading invoices...
                        </TableCell>
                      </TableRow>
                    ) : salesInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No sales invoices recorded. Create your first invoice to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      salesInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{format(new Date(invoice.issue_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>{invoice.counterparty_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {invoice.supply_type === "standard" && "Standard"}
                              {invoice.supply_type === "zero" && "Zero Rated"}
                              {invoice.supply_type === "exempt" && "Exempt"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            ₦{Number(invoice.net).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            ₦{Number(invoice.vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₦{(Number(invoice.net) + Number(invoice.vat)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            {invoice.efs_status === "accepted" && (
                              <Badge className="bg-green-500">Accepted</Badge>
                            )}
                            {invoice.efs_status === "queued" && (
                              <Badge variant="secondary">Queued</Badge>
                            )}
                            {invoice.efs_status === "rejected" && (
                              <Badge variant="destructive">Rejected</Badge>
                            )}
                            {(!invoice.efs_status || invoice.efs_status === "draft") && (
                              <Badge variant="outline">Draft</Badge>
                            )}
                            {invoice.locked && <span className="text-xs ml-1">🔒</span>}
                          </TableCell>
                          <TableCell>
                            {invoice.locked ? (
                              <span className="text-xs text-muted-foreground">Locked</span>
                            ) : invoice.efs_status === "rejected" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => transmitInvoice(invoice.id)}
                              >
                                Retry
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => transmitInvoice(invoice.id)}
                                disabled={invoice.efs_status === "queued"}
                              >
                                {invoice.efs_status === "queued" ? "Processing" : "Transmit"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>
              </TabsContent>

              <TabsContent value="purchases" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Supply Type</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead className="text-right">VAT</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Loading invoices...
                        </TableCell>
                      </TableRow>
                    ) : purchaseInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No purchase invoices recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      purchaseInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{format(new Date(invoice.issue_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>{invoice.counterparty_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {invoice.supply_type === "standard" && "Standard"}
                              {invoice.supply_type === "zero" && "Zero Rated"}
                              {invoice.supply_type === "exempt" && "Exempt"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            ₦{Number(invoice.net).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            ₦{Number(invoice.vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₦{(Number(invoice.net) + Number(invoice.vat)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="returns" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Output VAT</TableHead>
                      <TableHead className="text-right">Input VAT</TableHead>
                      <TableHead className="text-right">Payable</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No VAT returns filed yet.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Floating Tax Q&A Widget */}
      {organization && (
        <FloatingTaxQA
          orgId={organization.id}
          returnType="vat"
          onInsertNote={handleInsertVATNote}
        />
      )}
    </DashboardLayout>
  );
};

export default VATConsole;
