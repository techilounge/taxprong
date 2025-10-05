import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const comparisonData = [
  {
    feature: "Time to file VAT return",
    manual: "4-6 hours",
    taxpro: "15 minutes",
    improvement: "95% faster",
  },
  {
    feature: "Error rate",
    manual: "15-20%",
    taxpro: "<1%",
    improvement: "19x more accurate",
  },
  {
    feature: "Cost per filing",
    manual: "₦50,000+",
    taxpro: "₦5,000",
    improvement: "90% cost reduction",
  },
  {
    feature: "Missed deadlines (yearly)",
    manual: "2-3 times",
    taxpro: "0 times",
    improvement: "100% compliance",
  },
  {
    feature: "Tax optimization insights",
    manual: "None",
    taxpro: "AI-powered",
    improvement: "Save ₦500k+ annually",
  },
];

const features = [
  { name: "Automated calculations", manual: false, taxpro: true },
  { name: "Deadline reminders", manual: false, taxpro: true },
  { name: "Document generation", manual: false, taxpro: true },
  { name: "AI tax advisor", manual: false, taxpro: true },
  { name: "Real-time compliance tracking", manual: false, taxpro: true },
  { name: "Bank integration", manual: false, taxpro: true },
  { name: "Multi-user collaboration", manual: false, taxpro: true },
  { name: "Audit trail", manual: false, taxpro: true },
];

export const ComparisonSection = () => {
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
          <h2 className="text-4xl font-bold mb-4">
            TaxProNG vs. Manual Tax Management
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See the dramatic difference automation makes
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Performance Comparison */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Manual</TableHead>
                      <TableHead>TaxProNG</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {row.feature}
                        </TableCell>
                        <TableCell className="text-destructive">
                          {row.manual}
                        </TableCell>
                        <TableCell className="text-primary font-semibold">
                          {row.taxpro}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature Comparison */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Feature Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      <span className="font-medium">{feature.name}</span>
                      <div className="flex gap-8">
                        <div className="w-20 text-center">
                          {feature.manual ? (
                            <Check className="h-5 w-5 text-primary inline" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground inline" />
                          )}
                        </div>
                        <div className="w-20 text-center">
                          {feature.taxpro ? (
                            <Check className="h-5 w-5 text-primary inline" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground inline" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ROI Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Average ROI: 10x in the first year
              </h3>
              <p className="text-muted-foreground text-lg">
                Businesses save an average of ₦500,000 annually in reduced
                consultant fees, eliminated penalties, and time savings.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
