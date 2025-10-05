import { CardDescription, CardTitle } from "@/components/ui/card";
import { Receipt, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FirstExpenseStepProps {
  onNext: () => void;
}

export const FirstExpenseStep = ({ onNext }: FirstExpenseStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Receipt className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Ready to Track Expenses</CardTitle>
        <CardDescription className="mt-2">
          Here's how to add your first expense
        </CardDescription>
      </div>

      <Alert>
        <AlertDescription>
          You can add expenses after completing this setup tour. Click "Get Started" to finish!
        </AlertDescription>
      </Alert>

      <div className="space-y-4 text-sm">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            1
          </div>
          <div>
            <h4 className="font-semibold mb-1">Navigate to Expenses</h4>
            <p className="text-muted-foreground">
              Click on "Expenses" in the sidebar menu
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            2
          </div>
          <div>
            <h4 className="font-semibold mb-1">Add New Expense</h4>
            <p className="text-muted-foreground">
              Click "+ New Expense" and fill in the details
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            3
          </div>
          <div>
            <h4 className="font-semibold mb-1">Upload Receipt (Optional)</h4>
            <p className="text-muted-foreground">
              Attach a receipt photo for your records and VAT recovery
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            4
          </div>
          <div>
            <h4 className="font-semibold mb-1">Track VAT</h4>
            <p className="text-muted-foreground">
              We'll automatically calculate recoverable VAT for you
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-primary/5 p-4 flex items-center gap-3">
        <ArrowRight className="h-5 w-5 text-primary" />
        <p className="text-sm">
          <strong>Pro tip:</strong> You can also import expenses in bulk from your bank statements
        </p>
      </div>
    </div>
  );
};
