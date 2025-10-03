import { useEffect, useState } from "react";
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
import { toast } from "sonner";

interface DashboardStats {
  pendingTasks: number;
  vatDueThisMonth: number;
  expensesThisMonth: number;
  openEngagements: number;
}

const Dashboard = () => {
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
        vatDueThisMonth: 0, // Will be calculated from VAT returns
        expensesThisMonth: expenseTotal,
        openEngagements: 0, // Will be calculated from engagements
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your Nigeria Tax Advisor workspace
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="justify-start">
              <Receipt className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
            <Button variant="outline" className="justify-start">
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-accent" />
                  <p className="text-sm">No recent activity</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
