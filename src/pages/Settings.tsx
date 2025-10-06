import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { DataExport } from "@/components/settings/DataExport";
import { DeleteRequest } from "@/components/settings/DeleteRequest";
import { BackupSettings } from "@/components/settings/BackupSettings";
import { BackupRuns } from "@/components/settings/BackupRuns";
import { TestDataGenerator } from "@/components/dev/TestDataGenerator";
import { OnboardingControl } from "@/components/settings/OnboardingControl";
import { PlanUsage } from "@/components/settings/PlanUsage";

const PRICING_PLANS = [
  {
    name: "Free",
    plan: "free" as const,
    price: "₦0",
    period: "/month",
    features: [
      "1 business",
      "50 expenses/month",
      "VAT Console",
      "PIT Calculator",
    ],
  },
  {
    name: "Pro",
    plan: "pro" as const,
    price: "₦15,000",
    period: "/month",
    features: [
      "3 businesses",
      "500 expenses/month",
      "All Free features",
      "CIT Calculator",
      "Exceptions tracking",
      "Bank import",
      "OCR receipts",
      "Marketplace access",
    ],
    popular: true,
  },
  {
    name: "Business",
    plan: "business" as const,
    price: "₦45,000",
    period: "/month",
    features: [
      "10 businesses",
      "2,000 expenses/month",
      "All Pro features",
      "Priority support",
      "Advanced analytics",
    ],
  },
  {
    name: "Practice",
    plan: "practice" as const,
    price: "₦150,000",
    period: "/month",
    features: [
      "50 businesses",
      "10,000 expenses/month",
      "All Business features",
      "Multi-user access",
      "Client portal",
      "White-label option",
    ],
  },
  {
    name: "Enterprise",
    plan: "enterprise" as const,
    price: "Custom",
    period: "",
    features: [
      "Unlimited businesses",
      "Unlimited expenses",
      "All Practice features",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
    ],
  },
];

export default function Settings() {
  const { subscription, plan, loading, switchPlan } = useSubscription();
  const { toast } = useToast();

  const handleUpgrade = async (selectedPlan: string) => {
    if (selectedPlan === "enterprise") {
      toast({
        title: "Contact Sales",
        description: "Please contact our sales team for Enterprise plans",
      });
      return;
    }

    const result = await switchPlan(selectedPlan as "free" | "pro" | "business" | "practice" | "enterprise");

    if (result.success) {
      const description = result.proRegistered 
        ? `Successfully switched to ${selectedPlan} plan. You've been registered as a Tax Professional!`
        : `Successfully switched to ${selectedPlan} plan`;
      
      toast({
        title: "Plan Updated!",
        description,
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to switch plan",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings & Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and account settings
          </p>
          <Badge variant="outline" className="mt-2">
            Testing Mode - Switch freely between plans
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              You are currently on the <strong className="capitalize">{plan}</strong> plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-lg px-4 py-1 capitalize">
                {plan}
              </Badge>
              {subscription?.status === "active" && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Active
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <PlanUsage />

        <div>
          <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRICING_PLANS.map((pricingPlan) => (
              <Card
                key={pricingPlan.plan}
                className={`relative ${
                  pricingPlan.popular
                    ? "border-primary shadow-lg"
                    : plan === pricingPlan.plan
                    ? "border-green-500"
                    : ""
                }`}
              >
                {pricingPlan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg rounded-tr-lg">
                    Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{pricingPlan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{pricingPlan.price}</span>
                    <span className="text-muted-foreground">{pricingPlan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {pricingPlan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan === pricingPlan.plan ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(pricingPlan.plan)}
                    >
                      {pricingPlan.plan === "enterprise" ? "Contact Sales" : `Switch to ${pricingPlan.name}`}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Share (for Professionals)</CardTitle>
            <CardDescription>
              Platform fee structure for tax professionals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="font-medium">Platform Fee</span>
                <Badge variant="secondary">15%</Badge>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="font-medium">Professional Payout</span>
                <Badge variant="secondary">85%</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Platform fees are automatically calculated and deducted from each invoice.
                Professionals receive 85% of the invoice amount after fees.
              </p>
            </div>
          </CardContent>
        </Card>

        <OnboardingControl />
        
        <TestDataGenerator />
        
        <BackupSettings />
        <div className="mt-6">
          <BackupRuns />
        </div>
        
        <DataExport />
        
        <DeleteRequest />
      </div>
    </DashboardLayout>
  );
}
