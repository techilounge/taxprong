import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExpensesByCategoryWidget } from "@/components/analytics/ExpensesByCategoryWidget";
import { InputVATTrendWidget } from "@/components/analytics/InputVATTrendWidget";
import { OnTimeFilingWidget } from "@/components/analytics/OnTimeFilingWidget";
import { ComplianceScore } from "@/components/analytics/ComplianceScore";
import { SaveReportDialog } from "@/components/analytics/SaveReportDialog";
import { SavedReportsList } from "@/components/analytics/SavedReportsList";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/hooks/useOrganization";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Analytics() {
  const { organization, loading } = useOrganization();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savedReportsKey, setSavedReportsKey] = useState(0);
  const { toast } = useToast();

  const handleReportSaved = () => {
    setSavedReportsKey(prev => prev + 1);
  };

  const handleReportSelect = (report: any) => {
    toast({
      title: "Report Loaded",
      description: `Viewing ${report.name}`,
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!organization) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No organization found
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Key metrics and insights for {organization.name}
            </p>
          </div>
          <Button onClick={() => setSaveDialogOpen(true)} size="sm" className="sm:size-default">
            <Save className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Save Report</span>
          </Button>
        </div>

        <SavedReportsList 
          key={savedReportsKey}
          orgId={organization.id} 
          onReportSelect={handleReportSelect}
        />

        <div className="grid gap-6">
          {/* Compliance Score - Full width */}
          <ComplianceScore />

          {/* On-Time Filing KPI - Full width */}
          <OnTimeFilingWidget orgId={organization.id} />

          {/* Expenses and VAT Trend - Side by side on larger screens */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ExpensesByCategoryWidget orgId={organization.id} />
            <InputVATTrendWidget orgId={organization.id} />
          </div>
        </div>

        <SaveReportDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          orgId={organization.id}
          onSaved={handleReportSaved}
        />
      </div>
    </DashboardLayout>
  );
}
