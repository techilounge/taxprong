import { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  Brain,
  FileText,
  Calendar,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    id: "ai-advisor",
    title: "AI Tax Advisor",
    icon: Brain,
    description:
      "Get instant answers to complex tax questions with our AI-powered advisor. Available 24/7, trained on Nigeria Tax Act 2025.",
    benefits: [
      "Instant responses to tax queries",
      "Trained on latest Nigerian tax laws",
      "Context-aware recommendations",
      "No waiting for consultants",
    ],
    mockup: "🤖",
  },
  {
    id: "automation",
    title: "Smart Automation",
    icon: Zap,
    description:
      "Automate repetitive tasks and let TaxProNG handle the heavy lifting. From data entry to form filling, we've got you covered.",
    benefits: [
      "Automated form filling",
      "Bank transaction imports",
      "Recurring expense tracking",
      "One-click report generation",
    ],
    mockup: "⚡",
  },
  {
    id: "compliance",
    title: "Compliance Calendar",
    icon: Calendar,
    description:
      "Never miss a deadline with our intelligent calendar. Get reminders for all filing obligations across VAT, CIT, PIT, and more.",
    benefits: [
      "Automated deadline reminders",
      "Multi-tax type tracking",
      "Email & SMS notifications",
      "Penalty avoidance alerts",
    ],
    mockup: "📅",
  },
  {
    id: "analytics",
    title: "Advanced Analytics",
    icon: TrendingUp,
    description:
      "Gain insights into your tax position with powerful analytics. Track trends, identify savings opportunities, and optimize your tax strategy.",
    benefits: [
      "Visual dashboards",
      "Trend analysis",
      "Tax savings opportunities",
      "Custom reports",
    ],
    mockup: "📊",
  },
  {
    id: "documents",
    title: "Document Generator",
    icon: FileText,
    description:
      "Generate all required tax documents with a single click. Pre-filled forms, computations, and supporting schedules ready to file.",
    benefits: [
      "One-click generation",
      "Pre-filled with your data",
      "FIRS-compliant formats",
      "Instant PDF downloads",
    ],
    mockup: "📄",
  },
  {
    id: "security",
    title: "Bank-Level Security",
    icon: Shield,
    description:
      "Your data is protected with military-grade encryption. SOC 2 compliant with regular security audits and backups.",
    benefits: [
      "256-bit encryption",
      "SOC 2 compliance",
      "Automated backups",
      "Multi-factor authentication",
    ],
    mockup: "🔒",
  },
];

export const FeatureShowcase = () => {
  const [activeTab, setActiveTab] = useState(features[0].id);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const activeFeature = features.find((f) => f.id === activeTab);

  return (
    <section ref={ref} className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">
            Everything You Need for Tax Compliance
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to make Nigerian tax compliance effortless
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full mb-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <TabsTrigger
                    key={feature.id}
                    value={feature.id}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{feature.title}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <TabsContent key={feature.id} value={feature.id}>
                  <Card>
                    <CardContent className="p-8">
                      <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Content */}
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-lg bg-primary/10">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold">{feature.title}</h3>
                          </div>

                          <p className="text-muted-foreground mb-6">
                            {feature.description}
                          </p>

                          <div className="space-y-3">
                            {feature.benefits.map((benefit, index) => (
                              <div key={index} className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                  </div>
                                </div>
                                <span className="text-foreground">{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Mockup */}
                        <div className="hidden lg:block">
                          <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-border">
                            <div className="text-9xl">{feature.mockup}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
};
