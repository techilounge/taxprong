import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExpensesByCategoryWidget } from "@/components/analytics/ExpensesByCategoryWidget";
import { InputVATTrendWidget } from "@/components/analytics/InputVATTrendWidget";
import { OnTimeFilingWidget } from "@/components/analytics/OnTimeFilingWidget";
import { useOrganization } from "@/hooks/useOrganization";
import { Loader2 } from "lucide-react";

export default function Analytics() {
  const { organization, loading } = useOrganization();

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
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Key metrics and insights for {organization.name}
          </p>
        </div>

        <div className="grid gap-6">
          {/* On-Time Filing KPI - Full width */}
          <OnTimeFilingWidget orgId={organization.id} />

          {/* Expenses and VAT Trend - Side by side on larger screens */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ExpensesByCategoryWidget orgId={organization.id} />
            <InputVATTrendWidget orgId={organization.id} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
