import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProInvoice {
  id: string;
  engagement_id: string;
  amount: number;
  platform_fee_percent: number | null;
  platform_fee_amount: number | null;
  pro_payout_amount: number | null;
  status: string | null;
  payment_ref: string | null;
  created_at: string;
  engagement?: {
    id: string;
    scope: string | null;
    client?: {
      profile?: {
        name: string;
      };
      business?: {
        name: string;
      };
    };
  };
}

export function useProInvoices(proId: string) {
  const [invoices, setInvoices] = useState<ProInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBilled: 0,
    totalPaid: 0,
    outstanding: 0,
    platformFees: 0,
  });

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pro_invoices")
        .select(`
          *,
          engagement:engagements(
            id,
            scope,
            client:clients(
              profile:person_user_id(name),
              business:business_id(name)
            )
          )
        `)
        .eq("engagement.pro_id", proId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setInvoices(data || []);

      // Calculate stats
      const totalBilled = (data || []).reduce((sum, inv) => sum + Number(inv.amount), 0);
      const totalPaid = (data || []).filter(inv => inv.status === "paid").reduce((sum, inv) => sum + Number(inv.amount), 0);
      const platformFees = (data || []).reduce((sum, inv) => sum + Number(inv.platform_fee_amount || 0), 0);

      setStats({
        totalBilled,
        totalPaid,
        outstanding: totalBilled - totalPaid,
        platformFees,
      });
    } catch (error: any) {
      console.error("Error loading invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (proId) {
      loadInvoices();
    }
  }, [proId]);

  const createInvoice = async (engagementId: string, amount: number) => {
    try {
      const platformFeePercent = 15;
      const platformFeeAmount = amount * (platformFeePercent / 100);
      const proPayoutAmount = amount - platformFeeAmount;

      const { data, error } = await supabase
        .from("pro_invoices")
        .insert({
          engagement_id: engagementId,
          amount,
          platform_fee_percent: platformFeePercent,
          platform_fee_amount: platformFeeAmount,
          pro_payout_amount: proPayoutAmount,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Invoice created successfully");
      await loadInvoices();
      return data;
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
      throw error;
    }
  };

  return {
    invoices,
    loading,
    stats,
    reload: loadInvoices,
    createInvoice,
  };
}
