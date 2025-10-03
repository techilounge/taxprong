import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface VATTrendData {
  period: string;
  input_vat: number;
}

interface Props {
  orgId: string;
}

export function InputVATTrendWidget({ orgId }: Props) {
  const [data, setData] = useState<VATTrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [orgId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get expenses from last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data: expenses, error } = await supabase
        .from("expenses")
        .select("date, vat_amount, vat_recoverable_pct")
        .eq("org_id", orgId)
        .gte("date", twelveMonthsAgo.toISOString().split('T')[0])
        .order("date");

      if (error) throw error;

      // Group by month and calculate input VAT
      const monthlyData: Record<string, number> = {};
      
      expenses?.forEach((expense) => {
        if (expense.vat_amount) {
          const date = new Date(expense.date);
          const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const recoverablePct = expense.vat_recoverable_pct || 1;
          const inputVat = Number(expense.vat_amount) * Number(recoverablePct);
          
          monthlyData[period] = (monthlyData[period] || 0) + inputVat;
        }
      });

      const chartData = Object.entries(monthlyData)
        .map(([period, input_vat]) => ({
          period,
          input_vat: Number(input_vat.toFixed(2)),
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      setData(chartData);
    } catch (error) {
      console.error("Error loading VAT trend:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      notation: "compact",
    }).format(value);
  };

  const formatMonth = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  };

  const handleMonthClick = (period: string) => {
    const [year, month] = period.split('-');
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);
    
    navigate(`/expenses?dateFrom=${startDate.toISOString().split('T')[0]}&dateTo=${endDate.toISOString().split('T')[0]}&hasVAT=true`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Input VAT Trend</CardTitle>
          <CardDescription>12-month recoverable VAT trend</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Input VAT Trend</CardTitle>
          <CardDescription>12-month recoverable VAT trend</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          No VAT data available for the last 12 months
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Input VAT Trend</CardTitle>
        <CardDescription>12-month recoverable VAT trend</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} onClick={(e) => e?.activeLabel && handleMonthClick(e.activeLabel)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tickFormatter={formatMonth}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip 
              labelFormatter={formatMonth}
              formatter={(value) => [formatCurrency(Number(value)), "Input VAT"]}
            />
            <Line 
              type="monotone" 
              dataKey="input_vat" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ r: 4, cursor: 'pointer' }}
              activeDot={{ r: 6, cursor: 'pointer' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
