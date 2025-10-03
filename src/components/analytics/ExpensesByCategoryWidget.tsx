import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

interface CategoryData {
  category: string;
  total: number;
}

interface Props {
  orgId: string;
}

export function ExpensesByCategoryWidget({ orgId }: Props) {
  const [data, setData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [orgId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: expenses, error } = await supabase
        .from("expenses")
        .select("category, amount")
        .eq("org_id", orgId)
        .gte("date", new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);

      if (error) throw error;

      const categoryTotals = expenses?.reduce((acc: Record<string, number>, exp) => {
        const category = exp.category || "Uncategorized";
        acc[category] = (acc[category] || 0) + Number(exp.amount);
        return acc;
      }, {});

      const chartData = Object.entries(categoryTotals || {})
        .map(([category, total]) => ({
          category,
          total: Number(total),
        }))
        .sort((a, b) => b.total - a.total);

      setData(chartData);
    } catch (error) {
      console.error("Error loading expenses by category:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(value);
  };

  const handleCategoryClick = (category: string) => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    navigate(`/expenses?category=${encodeURIComponent(category)}&dateFrom=${startOfYear}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category (YTD)</CardTitle>
          <CardDescription>Year-to-date expense breakdown</CardDescription>
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
          <CardTitle>Expenses by Category (YTD)</CardTitle>
          <CardDescription>Year-to-date expense breakdown</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          No expense data available for this year
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses by Category (YTD)</CardTitle>
        <CardDescription>Year-to-date expense breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(entry) => entry.category}
              onClick={(entry) => handleCategoryClick(entry.category)}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => {
              const total = data.reduce((sum, d) => sum + d.total, 0);
              const percentage = ((item.total / total) * 100).toFixed(1);
              return (
                <TableRow 
                  key={item.category}
                  onClick={() => handleCategoryClick(item.category)}
                  className="cursor-pointer hover:bg-accent"
                >
                  <TableCell className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {item.category}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {percentage}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
