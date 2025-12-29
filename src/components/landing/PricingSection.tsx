import { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 15000,
    yearlyPrice: 144000,
    description: "Perfect for individual business owners",
    features: [
      "1 business profile",
      "VAT & CIT filing",
      "AI Tax Advisor (50 queries/month)",
      "Document generation",
      "Email support",
      "Mobile app access",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    monthlyPrice: 45000,
    yearlyPrice: 432000,
    description: "For tax consultants managing multiple clients",
    features: [
      "Up to 10 client profiles",
      "All tax types (VAT, CIT, PIT, WHT, CGT)",
      "AI Tax Advisor (Unlimited)",
      "Advanced analytics",
      "Priority support",
      "Client portal access",
      "Bulk operations",
      "Custom branding",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    yearlyPrice: null,
    description: "For large organizations with complex needs",
    features: [
      "Unlimited profiles",
      "Dedicated account manager",
      "Custom integrations",
      "API access",
      "24/7 phone support",
      "On-premise deployment option",
      "Custom SLA",
      "Training & onboarding",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const formatPrice = (price: number | null) => {
    if (price === null) return "Custom";
    return `₦${price.toLocaleString()}`;
  };

  return (
    <section ref={ref} className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that fits your needs. All plans include 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={!isYearly ? "font-semibold" : "text-muted-foreground"}>
              Monthly
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={isYearly ? "font-semibold" : "text-muted-foreground"}>
              Yearly
            </span>
            {isYearly && (
              <Badge variant="secondary" className="ml-2">
                Save 20%
              </Badge>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <Card
                className={`relative h-full ${
                  plan.popular
                    ? "border-primary shadow-xl md:scale-105"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="mb-6">
                    <div className="text-4xl font-bold mb-2">
                      {formatPrice(
                        isYearly ? plan.yearlyPrice : plan.monthlyPrice
                      )}
                    </div>
                    {plan.monthlyPrice && (
                      <div className="text-muted-foreground">
                        per {isYearly ? "year" : "month"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                    onClick={() =>
                      plan.name === "Enterprise"
                        ? window.location.href = "mailto:sales@taxpro.ng"
                        : navigate("/auth")
                    }
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Money-Back Guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/10 text-green-700 dark:text-green-400">
            <Check className="h-5 w-5" />
            <span className="font-medium">30-day money-back guarantee</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
