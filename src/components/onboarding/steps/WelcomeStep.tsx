import { CardDescription, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  return (
    <div className="text-center space-y-4">
      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <CardTitle className="text-3xl">Welcome to TaxProNG!</CardTitle>
      <CardDescription className="text-lg">
        Let's get you set up in just a few steps. This quick tour will help you:
      </CardDescription>
      <div className="text-left max-w-md mx-auto space-y-3 mt-8">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-1 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
          <div>
            <p className="font-medium">Add your first business</p>
            <p className="text-sm text-muted-foreground">
              Set up your company profile and tax details
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-1 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
          <div>
            <p className="font-medium">Configure tax settings</p>
            <p className="text-sm text-muted-foreground">
              Choose your VAT scheme and other preferences
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-1 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
          <div>
            <p className="font-medium">Record your first expense</p>
            <p className="text-sm text-muted-foreground">
              Learn how to track expenses and recover VAT
            </p>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-8">
        Takes about 5 minutes • You can skip this anytime
      </p>
    </div>
  );
};
