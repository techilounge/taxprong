import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  type: "business" | "practice";
  role: "owner" | "staff" | "viewer";
}

export function useOrganization() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user's orgs
      const { data: orgUsers, error: orgError } = await supabase
        .from("org_users")
        .select(`
          role,
          orgs (
            id,
            name,
            type
          )
        `)
        .eq("user_id", session.user.id)
        .limit(1)
        .single();

      if (orgError) {
        // No org exists, create one
        const { data: newOrg, error: createError } = await supabase
          .from("orgs")
          .insert({
            name: "My Organization",
            type: "business",
            owner_id: session.user.id,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Add user to org
        const { error: memberError } = await supabase
          .from("org_users")
          .insert({
            org_id: newOrg.id,
            user_id: session.user.id,
            role: "owner",
          });

        if (memberError) throw memberError;

        setOrganization({
          id: newOrg.id,
          name: newOrg.name,
          type: newOrg.type,
          role: "owner",
        });
      } else if (orgUsers?.orgs) {
        const org = Array.isArray(orgUsers.orgs) ? orgUsers.orgs[0] : orgUsers.orgs;
        setOrganization({
          id: org.id,
          name: org.name,
          type: org.type,
          role: orgUsers.role,
        });
      }
    } catch (error: any) {
      console.error("Error loading organization:", error);
      toast.error("Failed to load organization");
    } finally {
      setLoading(false);
    }
  };

  return { organization, loading, reload: loadOrganization };
}
