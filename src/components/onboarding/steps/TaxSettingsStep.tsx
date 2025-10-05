import { CardDescription, CardTitle } from "@/components/ui/card";
import { Settings, CheckCircle2 } from "lucide-react";

interface TaxSettingsStepProps {
  onNext: () => void;
}

export const TaxSettingsStep = ({ onNext }: TaxSettingsStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Tax Settings</CardTitle>
        <CardDescription className="mt-2">
          Your business is ready to go with default settings
        </CardDescription>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-4 bg-muted/30">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold">Default VAT Scheme Applied</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Standard VAT scheme at 7.5% - You can change this anytime in settings
          </p>
        </div>

        <div className="rounded-lg border p-4 bg-muted/30">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold">Automatic Compliance Reminders</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            We'll remind you about VAT filing deadlines and other compliance dates
          </p>
        </div>

        <div className="rounded-lg border p-4 bg-muted/30">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold">Nigeria Tax Act 2025 Compliant</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            All calculations follow the latest FIRS regulations
          </p>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        You can customize these settings later in the Settings page
      </div>
    </div>
  );
};
