import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle2, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";

interface ComplianceMetrics {
  score: number;
  onTimeFilings: number;
  totalFilings: number;
  pendingReturns: number;
  overdueReturns: number;
  riskLevel: "low" | "medium" | "high";
  recommendations: string[];
}

export function ComplianceScore() {
  const { organization } = useOrganization();
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization) {
      calculateComplianceScore();
    }
  }, [organization]);

  const calculateComplianceScore = async () => {
    try {
      // Get filing events
      const { data: filingEvents } = await supabase
        .from("filing_events")
        .select("*")
        .eq("org_id", organization.id);

      // Get VAT returns
      const { data: vatReturns } = await supabase
        .from("vat_returns")
        .select("business_id, created_at, due_date")
        .in(
          "business_id",
          (
            await supabase
              .from("businesses")
              .select("id")
              .eq("org_id", organization.id)
          ).data?.map((b) => b.id) || []
        );

      const today = new Date();
      const totalFilings = (filingEvents?.length || 0) + (vatReturns?.length || 0);
      
      // Calculate on-time filings
      const onTimeFilings =
        (filingEvents?.filter((f) => f.filed_at && new Date(f.filed_at) <= new Date(f.due_date)).length || 0) +
        (vatReturns?.filter((v) => v.due_date && new Date(v.created_at) <= new Date(v.due_date)).length || 0);

      // Calculate overdue returns
      const overdueReturns =
        filingEvents?.filter((f) => !f.filed_at && new Date(f.due_date) < today).length || 0;

      // Calculate pending returns (due in next 30 days)
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const pendingReturns =
        filingEvents?.filter(
          (f) => !f.filed_at && new Date(f.due_date) >= today && new Date(f.due_date) <= thirtyDaysFromNow
        ).length || 0;

      // Calculate compliance score (0-100)
      let score = 100;

      // Deduct for overdue returns (severe penalty)
      score -= overdueReturns * 15;

      // Deduct for pending returns (minor penalty)
      score -= pendingReturns * 5;

      // Reward for on-time filing history
      if (totalFilings > 0) {
        const onTimeRate = onTimeFilings / totalFilings;
        score = Math.max(score, onTimeRate * 100);
      }

      score = Math.max(0, Math.min(100, score));

      // Determine risk level
      let riskLevel: "low" | "medium" | "high" = "low";
      if (score < 50 || overdueReturns > 2) riskLevel = "high";
      else if (score < 75 || overdueReturns > 0) riskLevel = "medium";

      // Generate recommendations
      const recommendations: string[] = [];
      if (overdueReturns > 0) {
        recommendations.push(`File ${overdueReturns} overdue return(s) immediately to avoid penalties (₦100K+ per return)`);
      }
      if (pendingReturns > 0) {
        recommendations.push(`${pendingReturns} return(s) due in next 30 days - prepare documentation now`);
      }
      if (onTimeFilings < totalFilings * 0.8) {
        recommendations.push("Set up automated reminders to improve on-time filing rate");
      }
      if (score >= 90) {
        recommendations.push("Excellent compliance! Consider applying for tax clearance certificate");
      }
      if (riskLevel === "high") {
        recommendations.push("High compliance risk - consider engaging a tax professional");
      }

      setMetrics({
        score,
        onTimeFilings,
        totalFilings,
        pendingReturns,
        overdueReturns,
        riskLevel,
        recommendations,
      });
    } catch (error) {
      console.error("Error calculating compliance score:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 75) return "text-info";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const getRiskBadgeVariant = (level: "low" | "medium" | "high") => {
    if (level === "low") return "default" as const;
    if (level === "medium") return "secondary" as const;
    return "destructive" as const;
  };

  if (loading || !metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading compliance data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Circular Gauge Card */}
      <Card className="overflow-hidden hover-scale animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Compliance Health
            </CardTitle>
            <Badge variant={getRiskBadgeVariant(metrics.riskLevel)}>
              {metrics.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Circular Progress Gauge */}
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                {/* Circular background */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="hsl(var(--muted))"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke={`hsl(var(--${
                      metrics.score >= 80 ? 'success' : 
                      metrics.score >= 60 ? 'warning' : 
                      'destructive'
                    }))`}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(metrics.score / 100) * 552.92} 552.92`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`text-5xl font-bold ${getScoreColor(metrics.score)}`}>
                    {Math.round(metrics.score)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Score</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-1" />
                <div className="text-xl font-bold">
                  {metrics.onTimeFilings}
                </div>
                <p className="text-xs text-muted-foreground">On-Time</p>
              </div>
              <div className="text-center">
                <Clock className="h-6 w-6 text-warning mx-auto mb-1" />
                <div className="text-xl font-bold">
                  {metrics.pendingReturns}
                </div>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-1" />
                <div className="text-xl font-bold">
                  {metrics.overdueReturns}
                </div>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations - Compact */}
      {metrics.recommendations.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {metrics.recommendations.slice(0, 2).map((rec, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  {metrics.riskLevel === "high" && idx === 0 ? (
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  )}
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
