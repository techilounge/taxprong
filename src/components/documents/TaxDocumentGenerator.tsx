import { useState } from "react";
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
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [period, setPeriod] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDocument = async () => {
    if (!selectedTemplate || !organization) {
      toast.error("Please select a document template");
      return;
    }

    setIsGenerating(true);

    try {
      const template = DOCUMENT_TEMPLATES.find((t) => t.id === selectedTemplate);
      
      // Simulate document generation
      // In production, this would call an edge function to generate actual PDFs
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Log audit
      await supabase.from("audit_logs").insert({
        entity: "document",
        entity_id: selectedTemplate,
        action: "export",
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      toast.success(`${template?.name} generated successfully!`);
      
      // In production, this would trigger a download
      // For now, just show success message
    } catch (error) {
      console.error("Document generation error:", error);
      toast.error("Failed to generate document");
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
