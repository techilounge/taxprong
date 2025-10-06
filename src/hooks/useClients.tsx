import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Client {
  id: string;
  created_by_pro: string;
  status: string;
  created_at: string;
  person_user_id: string | null;
  business_id: string | null;
  org_id: string | null;
  profile?: {
    name: string;
    email: string;
  };
  business?: {
    name: string;
  };
  engagements_count?: number;
}

export function useClients(proId: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          profile:person_user_id(name, email),
          business:business_id(name)
        `)
        .eq("created_by_pro", proId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get engagement counts
      const clientsWithCounts = await Promise.all(
        (data || []).map(async (client) => {
          const { count } = await supabase
            .from("engagements")
            .select("*", { count: "exact", head: true })
            .eq("client_id", client.id)
            .is("deleted_at", null);

          return {
            ...client,
            engagements_count: count || 0,
          };
        })
      );

      setClients(clientsWithCounts);
    } catch (error: any) {
      console.error("Error loading clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (proId) {
      loadClients();
    }
  }, [proId]);

  const addClient = async (clientData: {
    person_user_id?: string;
    business_id?: string;
    org_id?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          created_by_pro: proId,
          status: "active",
          ...clientData,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Client added successfully");
      await loadClients();
      return data;
    } catch (error: any) {
      console.error("Error adding client:", error);
      toast.error("Failed to add client");
      throw error;
    }
  };

  return {
    clients,
    loading,
    reload: loadClients,
    addClient,
  };
}
