import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "./useAdmin";

/**
 * Security monitoring hook for admins
 * Provides access to security events and metrics
 */

interface SecuritySummary {
  total_events: number;
  high_severity_events: number;
  unique_users: number;
  failed_rate_limits: number;
  tin_accesses: number;
  data_exports: number;
}

interface SecurityEvent {
  id: string;
  entity: string;
  action: string;
  time: string;
  severity: string | null;
  ip_address: string | null;
  user_email: string | null;
  user_name: string | null;
  event_type: string;
}

export function useSecurityMonitor() {
  const { isAdmin } = useAdmin();
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetch security summary for the specified time period
   */
  const fetchSummary = useCallback(
    async (daysBack: number = 7) => {
      if (!isAdmin) return;

      try {
        setLoading(true);
        const { data, error } = await supabase.rpc("get_security_summary", {
          _days_back: daysBack,
        });

        if (error) throw error;

        if (data && data.length > 0) {
          setSummary(data[0] as SecuritySummary);
        }
      } catch (error: any) {
        console.error("Error fetching security summary:", error);
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

  /**
   * Fetch recent security events
   */
  const fetchEvents = useCallback(
    async (limit: number = 50) => {
      if (!isAdmin) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("security_events")
          .select("*")
          .order("time", { ascending: false })
          .limit(limit);

        if (error) throw error;

        setEvents((data || []) as SecurityEvent[]);
      } catch (error: any) {
        console.error("Error fetching security events:", error);
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

  /**
   * Subscribe to real-time security events (high severity only)
   */
  const subscribeToHighSeverityEvents = useCallback(
    (callback: (event: SecurityEvent) => void) => {
      if (!isAdmin) return;

      const channel = supabase
        .channel("security-events")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "audit_logs",
            filter: "severity=in.(high,critical)",
          },
          async (payload) => {
            // Fetch the full event details
            const { data } = await supabase
              .from("security_events")
              .select("*")
              .eq("id", payload.new.id)
              .single();

            if (data) {
              callback(data as SecurityEvent);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    [isAdmin]
  );

  /**
   * Get severity badge color
   */
  const getSeverityColor = (severity: string | null): string => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  /**
   * Format event type for display
   */
  const formatEventType = (eventType: string): string => {
    return eventType
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSummary();
      fetchEvents();
    }
  }, [isAdmin, fetchSummary, fetchEvents]);

  return {
    summary,
    events,
    loading,
    fetchSummary,
    fetchEvents,
    subscribeToHighSeverityEvents,
    getSeverityColor,
    formatEventType,
    isAdmin,
  };
}

/**
 * Hook to audit TIN access at the application level
 * Call this when displaying business TIN data
 */
export function useAuditTINAccess() {
  const auditAccess = useCallback(async (businessId: string) => {
    try {
      await supabase.rpc("audit_sensitive_access", {
        _table_name: "businesses_tin",
        _record_id: businessId,
        _operation: "READ",
        _severity: "medium",
      });
    } catch (error) {
      console.error("Failed to audit TIN access:", error);
    }
  }, []);

  return { auditAccess };
}
