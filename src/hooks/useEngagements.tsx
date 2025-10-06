import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Engagement {
  id: string;
  pro_id: string;
  client_id: string;
  scope: string | null;
  fee_type: string | null;
  quote: number | null;
  escrow_status: string | null;
  created_at: string;
  deleted_at: string | null;
  client?: {
    id: string;
    profile?: {
      name: string;
      email: string;
    };
    business?: {
      name: string;
    };
  };
}

export function useEngagements(proId: string) {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEngagements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("engagements")
        .select(`
          *,
          client:clients(
            id,
            profile:person_user_id(name, email),
            business:business_id(name)
          )
        `)
        .eq("pro_id", proId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setEngagements(data || []);
    } catch (error: any) {
      console.error("Error loading engagements:", error);
      toast.error("Failed to load engagements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (proId) {
      loadEngagements();
    }
  }, [proId]);

  return {
    engagements,
    loading,
    reload: loadEngagements,
  };
}
