import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { MessageSquare } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const faqs = [
  {
    question: "Is TaxProNG compliant with Nigeria Tax Act 2025?",
    answer:
      "Yes, TaxProNG is fully compliant with the Nigeria Tax Act 2025. We continuously update our platform to reflect the latest tax regulations and requirements from FIRS.",
  },
  {
    question: "How long does it take to get started?",
    answer:
      "You can get started in less than 10 minutes. Simply sign up, add your business information, and you're ready to go.",
  },
  {
    question: "Can I import my existing tax data?",
    answer:
      "Yes! TaxProNG supports importing data from Excel and CSV files. Our platform makes it easy to migrate your existing records.",
  },
  {
    question: "What types of taxes does TaxProNG support?",
    answer:
      "TaxProNG supports all major Nigerian tax types including VAT, CIT (Companies Income Tax), PIT (Personal Income Tax), WHT (Withholding Tax), CGT (Capital Gains Tax), Stamp Duty, and industry-specific taxes.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use bank-level 256-bit encryption and regular security audits. Your data is stored on secure servers with automated backups. We never share your data with third parties.",
  },
  {
    question: "Do you offer training and support?",
    answer:
      "Yes! We provide comprehensive tutorials, knowledge base articles, and email support. Contact us through the support form for assistance.",
  },
  {
    question: "Can I use TaxProNG for multiple businesses?",
    answer:
      "Yes. Our Professional plan supports up to 3 business profiles, Business plan supports 10, and Enterprise plans support unlimited profiles. Perfect for tax consultants managing multiple clients.",
  },
  {
    question: "What happens after my free trial?",
    answer:
      "You can continue with our free plan which includes basic features, or upgrade to a paid plan for additional capabilities like CIT calculations, bank import, and advanced reporting.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, you can cancel your subscription anytime. No long-term contracts or cancellation fees. If you cancel, you'll have access until the end of your billing period.",
  },
  {
    question: "Is there a mobile app?",
    answer:
      "TaxProNG is fully responsive and works on all devices. Access your tax information from any smartphone or tablet browser.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Yes, you can export your data in CSV and JSON formats at any time. We support standard accounting software formats for easy integration with your existing tools.",
  },
  {
    question: "What about e-invoicing requirements?",
    answer:
      "TaxProNG is preparing for Nigeria's upcoming e-invoicing mandate (2026). We're monitoring FIRS guidelines to ensure seamless compliance when the system goes live.",
  },
  {
    question: "How do I get help?",
    answer:
      "Use our email support form to reach our team. We also have comprehensive documentation and tutorials available in the knowledge base.",
  },
  {
    question: "How accurate is the AI Tax Advisor?",
    answer:
      "Our AI Tax Advisor is trained on the complete Nigeria Tax Act 2025 and FIRS guidelines. While it provides highly accurate guidance, we recommend consulting with a licensed tax professional for complex situations.",
  },
];

export const FAQSection = () => {
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
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about TaxProNG
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border rounded-lg px-6 bg-card"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Still Have Questions CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12"
        >
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
              <p className="text-muted-foreground mb-6">
                Our support team is here to help you 24/7
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" size="lg" onClick={() => window.location.href = '/knowledge'}>
                  Visit Help Center
                </Button>
                <Button size="lg" onClick={() => window.location.href = '/support'}>
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
