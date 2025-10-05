import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { X, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const problems = [
  "Hours wasted on manual data entry",
  "Frequent calculation errors",
  "Missed filing deadlines",
  "Expensive consultant fees",
  "Lack of tax optimization insights",
  "Complex compliance requirements",
];

const solutions = [
  "Automated data import & processing",
  "AI-powered accurate calculations",
  "Never miss deadlines with smart reminders",
  "90% cost reduction with self-service",
  "AI advisor provides optimization tips",
  "Guided compliance with Tax Act 2025",
];

export const ProblemSolutionSection = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

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
            Say Goodbye to Tax Compliance Headaches
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your tax management from painful to effortless
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Before - Problems */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="h-full border-destructive/50">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-destructive/10">
                    <X className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="text-2xl font-bold">Before TaxProNG</h3>
                </div>

                <div className="space-y-4">
                  {problems.map((problem, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20"
                    >
                      <X className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{problem}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-muted-foreground italic">
                    "Tax season used to be my worst nightmare. The stress, the
                    errors, the constant worry about compliance..."
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* After - Solutions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="h-full border-primary/50">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">After TaxProNG</h3>
                </div>

                <div className="space-y-4">
                  {solutions.map((solution, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20"
                    >
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{solution}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground italic">
                    "TaxProNG completely changed how I handle taxes. Everything is
                    automated, accurate, and stress-free. Best decision I made!"
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
