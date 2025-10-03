import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Pro {
  id: string;
  user_id: string;
  org_id: string;
  practice_name: string | null;
  bio: string | null;
  hourly_rate: number | null;
  services: string[] | null;
  kyc_status: string | null;
}

export function usePro() {
  const [pro, setPro] = useState<Pro | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    loadPro();
  }, []);

  const loadPro = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("pros")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPro(data);
        setIsPro(true);
      }
    } catch (error: any) {
      console.error("Error loading pro:", error);
    } finally {
      setLoading(false);
    }
  };

  return { pro, isPro, loading, reload: loadPro };
}
