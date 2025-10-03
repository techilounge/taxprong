import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink } from "lucide-react";

interface PrivacyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
}

export function PrivacyModal({ open, onOpenChange, onAccept }: PrivacyModalProps) {
  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Privacy Notice & NDPA Compliance</DialogTitle>
          <DialogDescription>
            How we collect, use, and protect your data under Nigeria's NDPA
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">Summary</h3>
              <p className="text-muted-foreground leading-relaxed">
                We collect and process your personal and business data to provide tax compliance services, 
                including generating tax filings, storing financial records, and communicating with tax authorities. 
                All data is processed in accordance with the Nigeria Data Protection Act (NDPA) 2023.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">What Data We Collect</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Personal information (name, email, phone number, TIN)</li>
                <li>Business information (company name, address, financial records)</li>
                <li>Transaction data (invoices, expenses, bank statements)</li>
                <li>Tax returns and compliance documents</li>
                <li>Usage data and system logs</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">How We Use Your Data</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Prepare and file tax returns with FIRS and state tax authorities</li>
                <li>Generate e-invoices and compliance reports</li>
                <li>Provide AI-powered tax advice and calculations</li>
                <li>Store evidence and documentation for audit purposes</li>
                <li>Communicate updates and reminders about tax obligations</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Data Protection & Security</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We implement industry-standard security measures including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Encryption of data in transit and at rest</li>
                <li>Role-based access controls</li>
                <li>Regular security audits and monitoring</li>
                <li>Data backup and disaster recovery procedures</li>
                <li>Staff training on data protection obligations</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Your Rights Under NDPA</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Access your personal data we hold</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data (subject to legal retention requirements)</li>
                <li>Object to processing of your data</li>
                <li>Withdraw consent at any time</li>
                <li>Lodge a complaint with the Nigeria Data Protection Commission (NDPC)</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Data Retention</h3>
              <p className="text-muted-foreground leading-relaxed">
                We retain your data for the period required by Nigerian tax laws (typically 6 years from the 
                end of the tax year) and as long as necessary to provide our services. You may request earlier 
                deletion, subject to legal obligations.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Data Sharing</h3>
              <p className="text-muted-foreground leading-relaxed">
                We share your data only with:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Nigerian tax authorities (FIRS, state tax services) as required by law</li>
                <li>Licensed tax professionals you engage through our platform</li>
                <li>Service providers bound by strict confidentiality agreements</li>
                <li>Law enforcement when legally required</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Contact & Complaints</h3>
              <p className="text-muted-foreground leading-relaxed">
                For privacy inquiries or to exercise your rights, contact our Data Protection Officer at{" "}
                <a href="mailto:privacy@taxplatform.ng" className="text-primary hover:underline">
                  privacy@taxplatform.ng
                </a>
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                To lodge a complaint with the regulator:{" "}
                <a 
                  href="https://ndpc.gov.ng" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Nigeria Data Protection Commission
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </section>

            <section className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>Last updated:</strong> January 2025 | <strong>Version:</strong> 1.0
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                By using our services, you acknowledge that you have read and understood this privacy notice 
                and consent to the processing of your data as described.
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onAccept && (
            <Button onClick={handleAccept}>
              Accept & Continue
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}