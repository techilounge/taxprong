import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PrivacyModal } from "./PrivacyModal";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkConsent();
  }, []);

  const checkConsent = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Check if user has already accepted
      const { data, error } = await supabase
        .from("privacy_consents")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("accepted", true)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking consent:", error);
      }

      // Show banner if no consent found
      setVisible(!data);
    } catch (error) {
      console.error("Error checking consent:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("privacy_consents")
        .insert({
          user_id: session.user.id,
          accepted: true,
          accepted_at: new Date().toISOString(),
          version: "1.0",
        });

      if (error) throw error;

      setVisible(false);
      toast({
        title: "Thank you",
        description: "Your privacy preferences have been saved",
      });
    } catch (error: any) {
      console.error("Error saving consent:", error);
      toast({
        title: "Error",
        description: "Failed to save consent. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemindLater = () => {
    setVisible(false);
    // Banner will reappear on next session since no consent was saved
    toast({
      title: "Reminder set",
      description: "We'll ask again next time you visit",
    });
  };

  if (loading || !visible) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5">
        <Card className="max-w-4xl mx-auto p-4 shadow-lg border-2">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-base">Privacy & Data Protection Notice</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    We use your data to generate tax filings and store evidence in compliance with the Nigeria Data Protection Act (NDPA).{" "}
                    <button
                      onClick={() => setModalOpen(true)}
                      className="text-primary hover:underline font-medium"
                    >
                      View Privacy Notice
                    </button>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={handleRemindLater}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAccept} size="sm">
                  Accept & Continue
                </Button>
                <Button onClick={handleRemindLater} variant="outline" size="sm">
                  Remind Me Later
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <PrivacyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onAccept={handleAccept}
      />
    </>
  );
}