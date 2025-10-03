import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SubscriptionPlan = "free" | "pro" | "business" | "practice" | "enterprise";

interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: string;
  started_at: string;
  expires_at: string | null;
}

const PLAN_FEATURES = {
  free: {
    maxBusinesses: 1,
    maxExpenses: 50,
    vatConsole: true,
    pitCalculator: true,
    citCalculator: false,
    exceptions: false,
    bankImport: false,
    ocrReceipts: false,
    marketplace: false,
  },
  pro: {
    maxBusinesses: 3,
    maxExpenses: 500,
    vatConsole: true,
    pitCalculator: true,
    citCalculator: true,
    exceptions: true,
    bankImport: true,
    ocrReceipts: true,
    marketplace: true,
  },
  business: {
    maxBusinesses: 10,
    maxExpenses: 2000,
    vatConsole: true,
    pitCalculator: true,
    citCalculator: true,
    exceptions: true,
    bankImport: true,
    ocrReceipts: true,
    marketplace: true,
  },
  practice: {
    maxBusinesses: 50,
    maxExpenses: 10000,
    vatConsole: true,
    pitCalculator: true,
    citCalculator: true,
    exceptions: true,
    bankImport: true,
    ocrReceipts: true,
    marketplace: true,
  },
  enterprise: {
    maxBusinesses: -1, // unlimited
    maxExpenses: -1, // unlimited
    vatConsole: true,
    pitCalculator: true,
    citCalculator: true,
    exceptions: true,
    bankImport: true,
    ocrReceipts: true,
    marketplace: true,
  },
};

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (!data) {
        // Create free subscription for new users
        const { data: newSub, error: createError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: session.user.id,
            plan: "free",
            status: "active",
          })
          .select()
          .single();

        if (createError) throw createError;
        setSubscription(newSub as Subscription);
      } else {
        setSubscription(data as Subscription);
      }
    } catch (error: any) {
      console.error("Error loading subscription:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: keyof typeof PLAN_FEATURES.free): boolean => {
    if (!subscription) return PLAN_FEATURES.free[feature] as boolean;
    const plan = subscription.plan as SubscriptionPlan;
    return PLAN_FEATURES[plan][feature] as boolean;
  };

  const canCreate = (type: "business" | "expense"): boolean => {
    if (!subscription) return true;
    const plan = subscription.plan as SubscriptionPlan;
    const limit = type === "business" 
      ? PLAN_FEATURES[plan].maxBusinesses 
      : PLAN_FEATURES[plan].maxExpenses;
    return limit === -1; // unlimited
  };

  return {
    subscription,
    loading,
    plan: subscription?.plan || "free",
    hasFeature,
    canCreate,
    reload: loadSubscription,
  };
}
