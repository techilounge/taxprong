import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role: string;
  email: string;
  name: string | null;
  user_created_at: string;
}

export function useUserRoles() {
  const [roles, setRoles] = useState<UserRoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_role_assignments")
        .select("*")
        .order("role", { ascending: true });

      if (error) throw error;
      setRoles(data || []);
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (email: string, role: string) => {
    try {
      const { data, error } = await supabase.rpc("assign_role_by_email", {
        _email: email,
        _role: role as any,
      });

      if (error) throw error;

      toast({
        title: "Role assigned",
        description: `${role} role assigned to ${email}`,
      });

      await fetchRoles();
      return true;
    } catch (error: any) {
      console.error("Error assigning role:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const removeRole = async (email: string, role: string) => {
    try {
      const { data, error } = await supabase.rpc("remove_role_by_email", {
        _email: email,
        _role: role as any,
      });

      if (error) throw error;

      toast({
        title: "Role removed",
        description: `${role} role removed from ${email}`,
      });

      await fetchRoles();
      return true;
    } catch (error: any) {
      console.error("Error removing role:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchRoles();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("user_roles_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
        },
        () => {
          fetchRoles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    roles,
    loading,
    assignRole,
    removeRole,
    refresh: fetchRoles,
  };
}
