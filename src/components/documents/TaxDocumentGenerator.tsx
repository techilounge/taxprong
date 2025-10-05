import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";

interface Business {
  id: string;
  name: string;
  tin: string | null;
}

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  type: "return" | "report" | "certificate" | "declaration";
}

const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "vat-return",
    name: "VAT Return Form",
    description: "Monthly VAT return with invoice schedules",
    type: "return",
  },
  {
    id: "cit-return",
    name: "CIT Annual Return",
    description: "Corporate Income Tax return with financial statements",
    type: "return",
  },
  {
    id: "pit-return",
    name: "PIT Annual Return",
    description: "Personal Income Tax return form",
    type: "return",
  },
  {
    id: "cgt-return",
    name: "CGT Return",
    description: "Capital Gains Tax return for asset disposals",
    type: "return",
  },
  {
    id: "compliance-report",
    name: "Compliance Report",
    description: "Comprehensive tax compliance status report",
    type: "report",
  },
  {
    id: "tax-computation",
    name: "Tax Computation",
    description: "Detailed tax calculation worksheet",
    type: "report",
  },
  {
    id: "transfer-pricing",
    name: "Transfer Pricing Declaration",
    description: "Related party transaction declaration",
    type: "declaration",
  },
  {
    id: "etr-return",
    name: "ETR Information Return",
    description: "Effective Tax Rate return for MNEs (BEPS Pillar 2)",
    type: "return",
  },
];

export function TaxDocumentGenerator() {
  const { organization } = useOrganization();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [period, setPeriod] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      loadBusinesses();
    }
  }, [organization?.id]);

  const loadBusinesses = async () => {
    if (!organization?.id) return;
    
    setLoadingBusinesses(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, tin')
        .eq('org_id', organization.id)
        .order('name');

      if (error) throw error;
      setBusinesses(data || []);
      
      // Auto-select first business if available
      if (data && data.length > 0) {
        setSelectedBusiness(data[0].id);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
      toast.error('Failed to load businesses');
    } finally {
      setLoadingBusinesses(false);
    }
  };

  const generateDocument = async () => {
    if (!selectedTemplate || !organization) {
      toast.error("Please select a document template");
      return;
    }

    if (!period) {
      toast.error("Please select a period");
      return;
    }

    // Check if template requires a business
    const template = DOCUMENT_TEMPLATES.find((t) => t.id === selectedTemplate);
    const requiresBusiness = ['vat-return', 'cit-return', 'cgt-return', 'stamp-duty'].includes(selectedTemplate);
    
    if (requiresBusiness && !selectedBusiness) {
      toast.error("Please select a business for this document type");
      return;
    }

    setIsGenerating(true);

    try {
      // Call edge function to generate PDF
      const { data, error } = await supabase.functions.invoke('generate-tax-document', {
        body: {
          templateId: selectedTemplate,
          period: period,
          businessId: selectedBusiness || undefined,
          orgId: organization.id,
        },
      });

      if (error) throw error;

      // Log audit
      await supabase.from("audit_logs").insert({
        entity: "document",
        entity_id: data.document.id,
        action: "export",
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      toast.success(`${template?.name} generated successfully!`);
      
      // Trigger download
      if (data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = `${selectedTemplate}-${period}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Reset form
      setSelectedTemplate("");
      setPeriod("");
    } catch (error: any) {
      console.error("Document generation error:", error);
      toast.error(error.message || "Failed to generate document. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const templatesByType = DOCUMENT_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.type]) acc[template.type] = [];
    acc[template.type].push(template);
    return acc;
  }, {} as Record<string, DocumentTemplate[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Tax Document Generator
        </CardTitle>
        <CardDescription>
          Generate professional tax returns, reports, and declarations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {businesses.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="business">Business</Label>
            <Select value={selectedBusiness} onValueChange={setSelectedBusiness} disabled={loadingBusinesses}>
              <SelectTrigger>
                <SelectValue placeholder="Select business" />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name} {business.tin ? `(${business.tin})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="template">Document Template</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(templatesByType).map(([type, templates]) => (
                <div key={type}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                    {type}s
                  </div>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
          {selectedTemplate && (
            <p className="text-xs text-muted-foreground">
              {DOCUMENT_TEMPLATES.find((t) => t.id === selectedTemplate)?.description}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="period">Period</Label>
          <Input
            id="period"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="Select period"
          />
        </div>

        <Button
          onClick={generateDocument}
          disabled={!selectedTemplate || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Document
            </>
          )}
        </Button>

        {/* Features */}
        <div className="border-t pt-4 space-y-2">
          <h4 className="text-sm font-semibold">Document Features:</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Auto-populated data</Badge>
            <Badge variant="outline">Professional formatting</Badge>
            <Badge variant="outline">Digital signatures</Badge>
            <Badge variant="outline">Audit trail</Badge>
            <Badge variant="outline">NRS compliant</Badge>
          </div>
        </div>

        {/* Info */}
        <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1">
          <p>💡 <strong>Coming Soon:</strong></p>
          <p>• Automated PDF generation with official templates</p>
          <p>• Digital signature integration</p>
          <p>• Bulk document generation</p>
          <p>• Direct submission to NRS portal</p>
        </div>
      </CardContent>
    </Card>
  );
}
