import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

interface FinancialData {
  month: string;
  revenue: number;
  expenses: number;
  net: number;
}

interface Props {
  orgId: string;
}

export const FinancialOverviewWidget = ({ orgId }: Props) => {
  const [data, setData] = useState<FinancialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<{ value: number; direction: 'up' | 'down' }>({ value: 0, direction: 'up' });

  useEffect(() => {
    loadFinancialData();
  }, [orgId]);

  const loadFinancialData = async () => {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Load expenses
      const { data: expenses } = await supabase
        .from("expenses")
        .select("date, amount")
        .eq("org_id", orgId)
        .gte("date", sixMonthsAgo.toISOString().split("T")[0]);

      // Load VAT returns for revenue estimation  
      // First get business IDs for this org
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id")
        .eq("org_id", orgId);

      const businessIds = businesses?.map(b => b.id) || [];
      
      let vatReturns: Array<{ period: string; output_vat: number | null }> | null = null;
      
      if (businessIds.length > 0) {
        const { data } = await supabase
          .from("vat_returns")
          .select("period, output_vat")
          .in("business_id", businessIds)
          .gte("period", sixMonthsAgo.toISOString().split("T")[0].substring(0, 7)); // YYYY-MM format
        vatReturns = data;
      }

      // Aggregate by month
      const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
      
      // Process expenses
      expenses?.forEach((expense) => {
        const month = new Date(expense.date).toLocaleDateString("en-US", { month: "short" });
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, expenses: 0 };
        }
        monthlyData[month].expenses += Number(expense.amount);
      });

      // Process VAT returns (estimate revenue from output VAT)
      vatReturns?.forEach((vat) => {
        // period is in YYYY-MM format, so convert to short month name
        const [year, monthNum] = vat.period.split('-');
        const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const month = monthDate.toLocaleDateString("en-US", { month: "short" });
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, expenses: 0 };
        }
        // Estimate revenue (output VAT / 0.075 for 7.5% VAT rate)
        monthlyData[month].revenue += Number(vat.output_vat) / 0.075;
      });

      // Convert to array and calculate net
      const chartData: FinancialData[] = Object.entries(monthlyData)
        .map(([month, values]) => ({
          month,
          revenue: Math.round(values.revenue),
          expenses: Math.round(values.expenses),
          net: Math.round(values.revenue - values.expenses),
        }))
        .slice(-6); // Last 6 months

      // Calculate trend (compare last 2 months)
      if (chartData.length >= 2) {
        const lastNet = chartData[chartData.length - 1].net;
        const prevNet = chartData[chartData.length - 2].net;
        const change = ((lastNet - prevNet) / Math.abs(prevNet)) * 100;
        setTrend({
          value: Math.abs(Math.round(change)),
          direction: change >= 0 ? 'up' : 'down',
        });
      }

      setData(chartData);
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
    expenses: {
      label: "Expenses",
      color: "hsl(var(--destructive))",
    },
    net: {
      label: "Net",
      color: "hsl(var(--accent))",
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-scale">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>6-month revenue, expenses & net position</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {trend.direction === 'up' ? (
              <TrendingUp className="h-5 w-5 text-success" />
            ) : (
              <TrendingDown className="h-5 w-5 text-destructive" />
            )}
            <span className={`text-sm font-medium ${trend.direction === 'up' ? 'text-success' : 'text-destructive'}`}>
              {trend.value}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                fill="url(#colorExpenses)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
