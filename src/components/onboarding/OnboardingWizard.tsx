import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {  Sparkles, Building2, Settings, Receipt, CheckCircle2, X } from "lucide-react";
import { WelcomeStep } from "./steps/WelcomeStep";
import { BusinessStep } from "./steps/BusinessStep";
import { TaxSettingsStep } from "./steps/TaxSettingsStep";
import { FirstExpenseStep } from "./steps/FirstExpenseStep";
import { CompletionStep } from "./steps/CompletionStep";

const STEPS = [
  { id: 0, title: "Welcome", icon: Sparkles },
  { id: 1, title: "Add Business", icon: Building2 },
  { id: 2, title: "Tax Settings", icon: Settings },
  { id: 3, title: "First Expense", icon: Receipt },
  { id: 4, title: "Complete", icon: CheckCircle2 },
];

export const OnboardingWizard = ({ onRestart }: { onRestart?: () => void } = {}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("onboarding_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data || (!data.completed && !data.skipped)) {
        setIsOpen(true);
        if (data) {
          setCurrentStep(data.current_step);
          setCompletedSteps(data.completed_steps as number[]);
        }
      }
    } catch (error) {
      console.error("Error checking onboarding:", error);
    }
  };

  const updateProgress = async (step: number, completed: boolean = false, skipped: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newCompletedSteps = [...completedSteps, step];
      
      const { error } = await supabase
        .from("onboarding_progress")
        .upsert({
          user_id: user.id,
          current_step: step,
          completed_steps: newCompletedSteps,
          completed,
          skipped,
          completed_at: completed ? new Date().toISOString() : null,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      
      if (!skipped) {
        setCompletedSteps(newCompletedSteps);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const restartOnboarding = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsOpen(true);
  };

  // Expose restart function to parent
  useEffect(() => {
    if (onRestart) {
      (window as any).restartOnboarding = restartOnboarding;
    }
  }, [onRestart]);

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      await updateProgress(currentStep);
      setCurrentStep(currentStep + 1);
    } else {
      await updateProgress(currentStep, true);
      setIsOpen(false);
      toast({
        title: "Welcome to TaxProNG!",
        description: "You're all set up and ready to go.",
      });
      navigate("/dashboard");
    }
  };

  const handleSkip = async () => {
    await updateProgress(currentStep, false, true);
    setIsOpen(false);
    navigate("/dashboard");
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const progress = ((currentStep) / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
          </div>
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    index === currentStep
                      ? "text-primary"
                      : completedSteps.includes(index)
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`rounded-full p-2 ${
                      index === currentStep
                        ? "bg-primary/10"
                        : completedSteps.includes(index)
                        ? "bg-green-100"
                        : "bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[60vh]">
          {currentStep === 0 && <WelcomeStep onNext={handleNext} />}
          {currentStep === 1 && <BusinessStep onNext={handleNext} />}
          {currentStep === 2 && <TaxSettingsStep onNext={handleNext} />}
          {currentStep === 3 && <FirstExpenseStep onNext={handleNext} />}
          {currentStep === 4 && <CompletionStep onComplete={handleNext} />}

          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
              <Button onClick={handleNext}>
                {currentStep === STEPS.length - 1 ? "Get Started" : "Continue"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
