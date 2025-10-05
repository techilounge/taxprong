import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw } from "lucide-react";

export const OnboardingControl = () => {
  const { toast } = useToast();

  const handleRestartOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Reset onboarding progress in database
      const { error } = await supabase
        .from("onboarding_progress")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Onboarding Reset",
        description: "Refreshing page to start onboarding wizard...",
      });

      // Refresh the page to trigger onboarding
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error restarting onboarding:", error);
      toast({
        title: "Error",
        description: "Failed to restart onboarding. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding Wizard</CardTitle>
        <CardDescription>
          Restart the setup wizard to review the platform features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleRestartOnboarding} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" />
          Restart Onboarding
        </Button>
      </CardContent>
    </Card>
  );
};
