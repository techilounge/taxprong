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
  trial_ends_at?: string | null;
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

  const canCreate = async (type: "business" | "expense", orgId?: string): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> => {
    if (!subscription) {
      return { allowed: true, current: 0, limit: -1 };
    }

    const plan = subscription.plan as SubscriptionPlan;
    const limit = type === "business" 
      ? PLAN_FEATURES[plan].maxBusinesses 
      : PLAN_FEATURES[plan].maxExpenses;

    // Unlimited plan
    if (limit === -1) {
      return { allowed: true, current: 0, limit: -1 };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { allowed: false, current: 0, limit, message: "User not authenticated" };
      }

      let current = 0;

      if (type === "business") {
        // Count non-deleted businesses for the org
        const { count, error } = await supabase
          .from("businesses")
          .select("*", { count: "exact", head: true })
          .is("deleted_at", null);
        
        if (error) throw error;
        current = count || 0;
      } else {
        // Count expenses for current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        let query = supabase
          .from("expenses")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startOfMonth.toISOString());

        if (orgId) {
          query = query.eq("org_id", orgId);
        }

        const { count, error } = await query;
        
        if (error) throw error;
        current = count || 0;
      }

      const allowed = current < limit;
      const message = allowed 
        ? undefined 
        : `You've reached your plan limit of ${limit} ${type === "business" ? "businesses" : "expenses per month"}. Please upgrade your plan to add more.`;

      return { allowed, current, limit, message };
    } catch (error) {
      console.error("Error checking limits:", error);
      return { allowed: false, current: 0, limit, message: "Error checking plan limits" };
    }
  };

  const isTrialActive = (): boolean => {
    if (!subscription?.trial_ends_at) return false;
    return new Date(subscription.trial_ends_at) > new Date();
  };

  const trialDaysRemaining = (): number => {
    if (!subscription?.trial_ends_at) return 0;
    const now = new Date();
    const trialEnd = new Date(subscription.trial_ends_at);
    const diff = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const isExpired = (): boolean => {
    if (!subscription) return false;
    if (subscription.status !== "active") return true;
    if (subscription.expires_at) {
      return new Date(subscription.expires_at) < new Date();
    }
    return false;
  };

  const switchPlan = async (newPlan: SubscriptionPlan): Promise<{ success: boolean; error?: string; proRegistered?: boolean }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: "User not authenticated" };
      }

      const { error } = await supabase
        .from("subscriptions")
        .update({ 
          plan: newPlan, 
          status: "active" 
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      let proRegistered = false;

      // Auto-register as Tax Professional for Practice plan
      if (newPlan === "practice") {
        // Check if already registered as pro
        const { data: existingPro } = await supabase
          .from("pros")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (!existingPro) {
          // Get user's org_id
          const { data: orgUser, error: orgError } = await supabase
            .from("org_users")
            .select("org_id")
            .eq("user_id", session.user.id)
            .single();

          if (orgError || !orgUser) {
            throw new Error("Could not find organization. Please ensure you have an organization set up.");
          }

          // Get user's profile name for default practice name
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", session.user.id)
            .single();

          // Create pro record
          const { error: proError } = await supabase
            .from("pros")
            .insert({
              user_id: session.user.id,
              org_id: orgUser.org_id,
              practice_name: profile?.name ? `${profile.name}'s Practice` : "My Practice",
            });

          if (proError) throw proError;
          proRegistered = true;
        }
      }

      // Reload subscription to get updated data
      await loadSubscription();

      return { success: true, proRegistered };
    } catch (error: any) {
      console.error("Error switching plan:", error);
      return { 
        success: false, 
        error: error.message || "Failed to switch plan" 
      };
    }
  };

  return {
    subscription,
    loading,
    plan: subscription?.plan || "free",
    hasFeature,
    canCreate,
    reload: loadSubscription,
    isTrialActive,
    trialDaysRemaining,
    isExpired,
    switchPlan,
  };
}
