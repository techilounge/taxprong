import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Receipt, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Calendar,
  TrendingUp,
  DollarSign,
  Clock
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { TaxDocumentGenerator } from "@/components/documents/TaxDocumentGenerator";
import { EnhancedStatCard } from "@/components/dashboard/EnhancedStatCard";
import { FinancialOverviewWidget } from "@/components/dashboard/FinancialOverviewWidget";
import { ComplianceScore } from "@/components/analytics/ComplianceScore";
import { ExpensesByCategoryWidget } from "@/components/analytics/ExpensesByCategoryWidget";
import { InputVATTrendWidget } from "@/components/analytics/InputVATTrendWidget";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface DashboardStats {
  pendingTasks: number;
  vatDueThisMonth: number;
  expensesThisMonth: number;
  openEngagements: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const [stats, setStats] = useState<DashboardStats>({
    pendingTasks: 0,
    vatDueThisMonth: 0,
    expensesThisMonth: 0,
    openEngagements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load tasks
      const { count: taskCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

      // Load expenses for current month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];
      
      const { data: expenses } = await supabase
        .from("expenses")
        .select("amount")
        .gte("date", startOfMonth);

      const expenseTotal = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

      setStats({
        pendingTasks: taskCount || 0,
        vatDueThisMonth: 0,
        expensesThisMonth: expenseTotal,
        openEngagements: 0,
      });
    } catch (error: any) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Tasks Due",
      value: stats.pendingTasks,
      description: "Open tasks requiring attention",
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Expenses This Month",
      value: `₦${stats.expensesThisMonth.toLocaleString()}`,
      description: "Total expenses recorded",
      icon: Receipt,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "VAT Due",
      value: `₦${stats.vatDueThisMonth.toLocaleString()}`,
      description: "Due by 14th of next month",
      icon: FileText,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Active Engagements",
      value: stats.openEngagements,
      description: "Open client engagements",
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <DashboardLayout>
      <OnboardingWizard />
      <div className="space-y-6">
        <TrialBanner />
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your TaxProNG workspace
          </p>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <EnhancedStatCard
            title="Tasks Due"
            value={stats.pendingTasks}
            description="Open tasks requiring attention"
            icon={Clock}
            color="text-warning"
            bgColor="bg-warning/10"
            animated
          />
          <EnhancedStatCard
            title="Expenses This Month"
            value={stats.expensesThisMonth}
            description="Total expenses recorded"
            icon={Receipt}
            color="text-primary"
            bgColor="bg-primary/10"
            prefix="₦"
            animated
          />
          <EnhancedStatCard
            title="VAT Due"
            value={stats.vatDueThisMonth}
            description="Due by 14th of next month"
            icon={FileText}
            color="text-info"
            bgColor="bg-info/10"
            prefix="₦"
            animated
          />
          <EnhancedStatCard
            title="Active Engagements"
            value={stats.openEngagements}
            description="Open client engagements"
            icon={TrendingUp}
            color="text-accent"
            bgColor="bg-accent/10"
            animated
          />
        </div>

        {/* Financial Overview & Compliance */}
        {organization && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <FinancialOverviewWidget orgId={organization.id} />
            </div>
            <div>
              <ComplianceScore />
            </div>
          </div>
        )}

        {/* Analytics Widgets */}
        {organization && (
          <div className="grid gap-4 md:grid-cols-2">
            <ExpensesByCategoryWidget orgId={organization.id} />
            <InputVATTrendWidget orgId={organization.id} />
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="justify-start" onClick={() => navigate('/expenses')}>
              <Receipt className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => navigate('/vat')}>
              <FileText className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => navigate('/vat')}>
              <Calendar className="mr-2 h-4 w-4" />
              File VAT Return
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-l-4 border-warning pl-3">
                  <div>
                    <p className="font-medium">VAT Return</p>
                    <p className="text-sm text-muted-foreground">November 2025</p>
                  </div>
                  <Badge variant="outline">7 days</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <TaxDocumentGenerator />
        </div>

        {/* Tax Reform Alert */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900">Nigeria Tax Act 2025 in Effect</p>
                <p className="text-sm text-blue-800 mt-1">
                  Major reforms: ₦800K PIT threshold, 30% CGT rate, 4% Development Levy, mandatory e-invoicing from 2026
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
