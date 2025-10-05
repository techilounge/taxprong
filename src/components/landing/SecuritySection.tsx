import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Shield, Lock, Database, CheckCircle2, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrustBadge } from "@/components/ui/trust-badge";

const securityFeatures = [
  {
    icon: Lock,
    title: "256-bit Encryption",
    description:
      "Military-grade encryption protects your data in transit and at rest",
  },
  {
    icon: Shield,
    title: "SOC 2 Compliant",
    description:
      "Regular third-party audits ensure the highest security standards",
  },
  {
    icon: Database,
    title: "Automated Backups",
    description:
      "Daily encrypted backups with 30-day retention and instant recovery",
  },
  {
    icon: CheckCircle2,
    title: "Multi-Factor Authentication",
    description:
      "Add an extra layer of security with 2FA via SMS or authenticator apps",
  },
];

export const SecuritySection = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section ref={ref} className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Bank-Level Security You Can Trust
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your sensitive financial data deserves the highest level of protection
          </p>
        </motion.div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          <TrustBadge variant="firs" />
          <TrustBadge variant="security" />
          <TrustBadge variant="iso" />
          <TrustBadge variant="data-protection" />
        </motion.div>

        {/* Compliance Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="max-w-3xl mx-auto bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    Regulatory Compliance Guaranteed
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    TaxProNG is built to comply with Nigeria Tax Act 2025 and FIRS
                    guidelines. We continuously update our platform to reflect the
                    latest regulations.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>FIRS-approved tax calculation methodologies</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Ready for e-invoicing mandate (2026)</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Data sovereignty with Nigeria-based servers</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
