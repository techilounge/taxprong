import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Receipt } from "lucide-react";

export const PlanUsage = () => {
  const { plan, loading } = useSubscription();
  const [businessCount, setBusinessCount] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  const [loadingUsage, setLoadingUsage] = useState(true);

  const PLAN_LIMITS = {
    free: { businesses: 1, expenses: 50 },
    pro: { businesses: 3, expenses: 500 },
    business: { businesses: 10, expenses: 2000 },
    practice: { businesses: 50, expenses: 10000 },
    enterprise: { businesses: -1, expenses: -1 },
  };

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      setLoadingUsage(true);
      
      // Get business count
      const { count: bizCount } = await supabase
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null);
      
      setBusinessCount(bizCount || 0);

      // Get expense count for current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: expCount } = await supabase
        .from("expenses")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());
      
      setExpenseCount(expCount || 0);
    } catch (error) {
      console.error("Error loading usage:", error);
    } finally {
      setLoadingUsage(false);
    }
  };

  if (loading || loadingUsage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan Usage</CardTitle>
          <CardDescription>Loading usage data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
  const businessLimit = limits.businesses;
  const expenseLimit = limits.expenses;

  const businessPercentage = businessLimit === -1 
    ? 0 
    : (businessCount / businessLimit) * 100;
  
  const expensePercentage = expenseLimit === -1 
    ? 0 
    : (expenseCount / expenseLimit) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Usage</CardTitle>
        <CardDescription>
          Monitor your current usage against plan limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Businesses Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Businesses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {businessCount} / {businessLimit === -1 ? "∞" : businessLimit}
              </span>
              {businessPercentage >= 80 && businessLimit !== -1 && (
                <Badge variant={businessPercentage >= 100 ? "destructive" : "secondary"}>
                  {businessPercentage >= 100 ? "Limit Reached" : "Almost Full"}
                </Badge>
              )}
            </div>
          </div>
          {businessLimit !== -1 && (
            <Progress 
              value={Math.min(businessPercentage, 100)} 
              className={businessPercentage >= 100 ? "bg-destructive/20" : ""}
            />
          )}
        </div>

        {/* Expenses Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Expenses (This Month)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {expenseCount} / {expenseLimit === -1 ? "∞" : expenseLimit}
              </span>
              {expensePercentage >= 80 && expenseLimit !== -1 && (
                <Badge variant={expensePercentage >= 100 ? "destructive" : "secondary"}>
                  {expensePercentage >= 100 ? "Limit Reached" : "Almost Full"}
                </Badge>
              )}
            </div>
          </div>
          {expenseLimit !== -1 && (
            <Progress 
              value={Math.min(expensePercentage, 100)} 
              className={expensePercentage >= 100 ? "bg-destructive/20" : ""}
            />
          )}
        </div>

        {/* Upgrade Notice */}
        {(businessPercentage >= 80 || expensePercentage >= 80) && 
         (businessLimit !== -1 || expenseLimit !== -1) && (
          <div className="rounded-lg bg-primary/5 p-4 text-sm">
            <p className="font-medium text-primary">Consider upgrading your plan</p>
            <p className="text-muted-foreground mt-1">
              You're approaching your plan limits. Upgrade to continue adding more data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
