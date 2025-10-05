import { CardDescription, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Sparkles } from "lucide-react";

interface CompletionStepProps {
  onComplete: () => void;
}

export const CompletionStep = ({ onComplete }: CompletionStepProps) => {
  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <CardTitle className="text-3xl">You're All Set!</CardTitle>
      <CardDescription className="text-lg">
        Your TaxProNG account is ready to use
      </CardDescription>

      <div className="bg-muted/30 rounded-lg p-6 text-left space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          What's Next?
        </h4>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
            <span>Add expenses to start tracking your VAT</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
            <span>Set up invoicing for your customers</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
            <span>Check the compliance calendar for upcoming deadlines</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
            <span>Ask the AI Tax Advisor if you have questions</span>
          </li>
        </ul>
      </div>

      <div className="text-sm text-muted-foreground">
        You can always access the help center or contact support if you need assistance
      </div>
    </div>
  );
};
