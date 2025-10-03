import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
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

  if (loading || !metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading compliance data...</p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = () => {
    if (metrics.score >= 90) return "text-green-600";
    if (metrics.score >= 75) return "text-blue-600";
    if (metrics.score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getRiskBadgeVariant = () => {
    if (metrics.riskLevel === "low") return "default";
    if (metrics.riskLevel === "medium") return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Health Score
          </CardTitle>
          <CardDescription>
            Your tax compliance rating based on filing history and deadlines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-5xl font-bold ${getScoreColor()}`}>{Math.round(metrics.score)}</p>
                <p className="text-sm text-muted-foreground">out of 100</p>
              </div>
              <Badge variant={getRiskBadgeVariant()} className="text-lg px-4 py-2">
                {metrics.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>

            <Progress value={metrics.score} className="h-3" />

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics.onTimeFilings}</p>
                <p className="text-xs text-muted-foreground">On-time filings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{metrics.pendingReturns}</p>
                <p className="text-xs text-muted-foreground">Due soon</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{metrics.overdueReturns}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {metrics.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {metrics.recommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  {metrics.riskLevel === "high" && idx === 0 ? (
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
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

      {/* Score Interpretation */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-sm mb-2">Score Interpretation</h4>
          <div className="space-y-1 text-xs">
            <p>• <strong>90-100:</strong> Excellent - Strong compliance history</p>
            <p>• <strong>75-89:</strong> Good - Minor improvements needed</p>
            <p>• <strong>50-74:</strong> Fair - Address pending/overdue returns</p>
            <p>• <strong>Below 50:</strong> Poor - Immediate action required</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
