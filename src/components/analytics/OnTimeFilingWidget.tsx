import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  orgId: string;
}

export function OnTimeFilingWidget({ orgId }: Props) {
  const [percentage, setPercentage] = useState<number | null>(null);
  const [trend, setTrend] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [orgId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get filing events from last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data: filings, error } = await supabase
        .from("filing_events")
        .select("due_date, filed_at")
        .eq("org_id", orgId)
        .gte("due_date", twelveMonthsAgo.toISOString().split('T')[0]);

      if (error) throw error;

      if (!filings || filings.length === 0) {
        setPercentage(null);
        setTrend([]);
        return;
      }

      // Calculate on-time percentage
      const onTimeCount = filings.filter(f => {
        if (!f.filed_at) return false;
        return new Date(f.filed_at) <= new Date(f.due_date);
      }).length;

      const pct = (onTimeCount / filings.length) * 100;
      setPercentage(Number(pct.toFixed(2)));

      // Calculate monthly trend for sparkline
      const monthlyTrend: Record<string, { onTime: number; total: number }> = {};
      
      filings.forEach((filing) => {
        const date = new Date(filing.due_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyTrend[monthKey]) {
          monthlyTrend[monthKey] = { onTime: 0, total: 0 };
        }
        
        monthlyTrend[monthKey].total++;
        
        if (filing.filed_at && new Date(filing.filed_at) <= new Date(filing.due_date)) {
          monthlyTrend[monthKey].onTime++;
        }
      });

      const trendData = Object.values(monthlyTrend)
        .map(month => (month.onTime / month.total) * 100);
      
      setTrend(trendData);
    } catch (error) {
      console.error("Error loading filing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendDirection = () => {
    if (trend.length < 2) return null;
    const recent = trend[trend.length - 1];
    const previous = trend[trend.length - 2];
    return recent > previous ? "up" : recent < previous ? "down" : null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>On-Time Filing Rate</CardTitle>
          <CardDescription>Rolling 12-month compliance</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (percentage === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>On-Time Filing Rate</CardTitle>
          <CardDescription>Rolling 12-month compliance</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          No filing data available for the last 12 months
        </CardContent>
      </Card>
    );
  }

  const trendDirection = getTrendDirection();

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/filing-events')}>
      <CardHeader>
        <CardTitle>On-Time Filing Rate</CardTitle>
        <CardDescription>Rolling 12-month compliance (click to view details)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-4xl font-bold">
              {percentage}%
            </div>
            {trendDirection && (
              <div className={`flex items-center gap-1 ${
                trendDirection === "up" ? "text-green-600" : "text-red-600"
              }`}>
                {trendDirection === "up" ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">
                  {trendDirection === "up" ? "Improving" : "Declining"}
                </span>
              </div>
            )}
          </div>

          {/* Simple sparkline visualization */}
          {trend.length > 0 && (
            <div className="flex items-end gap-1 h-16">
              {trend.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 bg-primary rounded-t"
                  style={{
                    height: `${value}%`,
                    opacity: 0.4 + (index / trend.length) * 0.6,
                  }}
                />
              ))}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Filings submitted on or before due date over the last 12 months
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
