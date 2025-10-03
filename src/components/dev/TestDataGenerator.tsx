import { useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Database, FileText, Receipt, Calendar, Building2, DollarSign, Loader2 } from "lucide-react";
import { logAudit } from "@/lib/auditLog";

interface SeedStats {
  businesses?: number;
  expenses?: number;
  invoices?: number;
  tasks?: number;
  filingEvents?: number;
  bankTxns?: number;
}

export function TestDataGenerator() {
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const generateTestBusinesses = async () => {
    if (!organization?.id) return;
    setLoading('businesses');
    
    try {
      const businesses = [
        { name: "Tech Solutions Ltd", tin: "12345678-0001", sector: "Technology", turnover_band: "50M-100M", vat_registered: true },
        { name: "Retail Ventures", tin: "12345678-0002", sector: "Retail", turnover_band: "10M-50M", vat_registered: true },
        { name: "Consulting Services", tin: "12345678-0003", sector: "Services", turnover_band: "5M-10M", vat_registered: false },
      ];

      const { data, error } = await supabase
        .from('businesses')
        .insert(businesses.map(b => ({ ...b, org_id: organization.id, owner_id: organization.owner_id })))
        .select();

      if (error) throw error;

      await logAudit('businesses', organization.id, 'create', `Generated ${data.length} test businesses`);

      toast({ title: "Success", description: `Created ${data.length} test businesses` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const generateTestExpenses = async () => {
    if (!organization?.id) return;
    setLoading('expenses');
    
    try {
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('org_id', organization.id)
        .limit(1);

      if (!businesses || businesses.length === 0) {
        toast({ title: "Error", description: "Create a business first", variant: "destructive" });
        return;
      }

      const businessId = businesses[0].id;
      const categories = ["Office Supplies", "Travel", "Software", "Utilities", "Marketing"];
      const merchants = ["Office Depot", "Delta Airlines", "Microsoft", "Power Co", "Google Ads"];
      
      const expenses = Array.from({ length: 10 }, (_, i) => ({
        org_id: organization.id,
        business_id: businessId,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 50000) + 5000,
        vat_amount: Math.floor(Math.random() * 3750) + 375,
        category: categories[i % categories.length],
        merchant: merchants[i % merchants.length],
        description: `Test expense ${i + 1}`,
      }));

      const { data, error } = await supabase
        .from('expenses')
        .insert(expenses)
        .select();

      if (error) throw error;

      await logAudit('expenses', organization.id, 'create', `Generated ${data.length} test expenses`);

      toast({ title: "Success", description: `Created ${data.length} test expenses` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const generateTestInvoices = async () => {
    if (!organization?.id) return;
    setLoading('invoices');
    
    try {
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('org_id', organization.id)
        .limit(1);

      if (!businesses || businesses.length === 0) {
        toast({ title: "Error", description: "Create a business first", variant: "destructive" });
        return;
      }

      const businessId = businesses[0].id;
      
      const invoices = Array.from({ length: 8 }, (_, i) => ({
        business_id: businessId,
        type: i % 2 === 0 ? 'sales' : 'purchase',
        supply_type: 'standard',
        issue_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        net: Math.floor(Math.random() * 100000) + 10000,
        vat_rate: 7.5,
        vat: Math.floor((Math.random() * 100000 + 10000) * 0.075),
        counterparty_name: `Test Customer ${i + 1}`,
        counterparty_tin: `TIN${i + 1}`,
        description: `Test invoice ${i + 1}`,
      }));

      const { data, error } = await supabase
        .from('invoices')
        .insert(invoices)
        .select();

      if (error) throw error;

      await logAudit('invoices', organization.id, 'create', `Generated ${data.length} test invoices`);

      toast({ title: "Success", description: `Created ${data.length} test invoices` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const generateTestTasks = async () => {
    if (!organization?.id) return;
    setLoading('tasks');
    
    try {
      const tasks = [
        { title: "Submit VAT Return", link_to: "vat-console", due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'open' },
        { title: "File CIT Return", link_to: "cit", due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'open' },
        { title: "Review Expenses", link_to: "expenses", due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'open' },
        { title: "Client Meeting", link_to: null, due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'open' },
        { title: "Reconcile Bank Statements", link_to: "exceptions", due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'done' },
      ];

      const { data, error } = await supabase
        .from('tasks')
        .insert(tasks.map(t => ({ ...t, org_id: organization.id })))
        .select();

      if (error) throw error;

      await logAudit('tasks', organization.id, 'create', `Generated ${data.length} test tasks`);

      toast({ title: "Success", description: `Created ${data.length} test tasks` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const generateTestFilingEvents = async () => {
    if (!organization?.id) return;
    setLoading('filingEvents');
    
    try {
      const filingEvents = [
        { filing_type: "VAT", period: "2025-01", due_date: "2025-02-14" },
        { filing_type: "VAT", period: "2025-02", due_date: "2025-03-14" },
        { filing_type: "CIT", period: "2024", due_date: "2025-06-30" },
        { filing_type: "WHT", period: "2025-01", due_date: "2025-02-10" },
      ];

      const { data, error } = await supabase
        .from('filing_events')
        .insert(filingEvents.map(f => ({ ...f, org_id: organization.id })))
        .select();

      if (error) throw error;

      await logAudit('filing_events', organization.id, 'create', `Generated ${data.length} test filing events`);

      toast({ title: "Success", description: `Created ${data.length} test filing events` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const generateTestBankTxns = async () => {
    if (!organization?.id) return;
    setLoading('bankTxns');
    
    try {
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('org_id', organization.id)
        .limit(1);

      if (!businesses || businesses.length === 0) {
        toast({ title: "Error", description: "Create a business first", variant: "destructive" });
        return;
      }

      const businessId = businesses[0].id;
      
      const transactions = Array.from({ length: 15 }, (_, i) => ({
        org_id: organization.id,
        business_id: businessId,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 100000) + 5000,
        direction: i % 3 === 0 ? 'credit' : 'debit',
        narration: `Test transaction ${i + 1} - ${i % 2 === 0 ? 'Invoice payment' : 'Operating expense'}`,
        import_batch_id: `TEST-${Date.now()}`,
      }));

      const { data, error } = await supabase
        .from('bank_txns')
        .insert(transactions)
        .select();

      if (error) throw error;

      await logAudit('bank_txns', organization.id, 'create', `Generated ${data.length} test bank transactions`);

      toast({ title: "Success", description: `Created ${data.length} test bank transactions` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const generateAllTestData = async () => {
    setLoading('all');
    try {
      await generateTestBusinesses();
      await new Promise(resolve => setTimeout(resolve, 500));
      await generateTestExpenses();
      await new Promise(resolve => setTimeout(resolve, 500));
      await generateTestInvoices();
      await new Promise(resolve => setTimeout(resolve, 500));
      await generateTestTasks();
      await new Promise(resolve => setTimeout(resolve, 500));
      await generateTestFilingEvents();
      await new Promise(resolve => setTimeout(resolve, 500));
      await generateTestBankTxns();
      
      toast({ title: "Success", description: "Generated all test data" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  if (!organization) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Test Data Generator
        </CardTitle>
        <CardDescription>
          Generate sample data for testing charts, reports, and workflows
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={generateTestBusinesses}
            disabled={loading !== null}
            className="flex items-center gap-2"
          >
            {loading === 'businesses' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            Generate Businesses
          </Button>

          <Button
            variant="outline"
            onClick={generateTestExpenses}
            disabled={loading !== null}
            className="flex items-center gap-2"
          >
            {loading === 'expenses' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Receipt className="h-4 w-4" />
            )}
            Generate Expenses
          </Button>

          <Button
            variant="outline"
            onClick={generateTestInvoices}
            disabled={loading !== null}
            className="flex items-center gap-2"
          >
            {loading === 'invoices' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Generate Invoices
          </Button>

          <Button
            variant="outline"
            onClick={generateTestTasks}
            disabled={loading !== null}
            className="flex items-center gap-2"
          >
            {loading === 'tasks' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            Generate Tasks
          </Button>

          <Button
            variant="outline"
            onClick={generateTestFilingEvents}
            disabled={loading !== null}
            className="flex items-center gap-2"
          >
            {loading === 'filingEvents' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            Generate Filing Events
          </Button>

          <Button
            variant="outline"
            onClick={generateTestBankTxns}
            disabled={loading !== null}
            className="flex items-center gap-2"
          >
            {loading === 'bankTxns' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <DollarSign className="h-4 w-4" />
            )}
            Generate Bank Txns
          </Button>

          <Button
            onClick={generateAllTestData}
            disabled={loading !== null}
            className="md:col-span-2 lg:col-span-3 flex items-center gap-2"
          >
            {loading === 'all' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Generate All Test Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
