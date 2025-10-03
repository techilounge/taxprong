import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EngagementWizardProps {
  proId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EngagementWizard({ proId, onSuccess, onCancel }: EngagementWizardProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    clientId: "",
    businessId: "",
    scope: "",
    feeType: "fixed" as "fixed" | "hourly" | "milestone",
    quote: "",
    loeUrl: "",
    authorityUrl: "",
  });

  const handleSubmit = async () => {
    if (!formData.clientId || !formData.scope || !formData.quote) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const { data: engagement, error: engagementError } = await supabase
        .from("engagements")
        .insert({
          pro_id: proId,
          client_id: formData.clientId,
          business_id: formData.businessId || null,
          scope: formData.scope,
          fee_type: formData.feeType,
          quote: parseFloat(formData.quote),
          loe_url: formData.loeUrl,
          authority_url: formData.authorityUrl,
          parties: [proId, formData.clientId],
        })
        .select()
        .single();

      if (engagementError) throw engagementError;

      // Create initial PBC tasks
      const pbcTasks = [
        { title: "Upload company registration documents", link_to: engagement.id },
        { title: "Provide financial statements", link_to: engagement.id },
        { title: "Submit tax identification documents", link_to: engagement.id },
      ];

      const { data: client } = await supabase
        .from("clients")
        .select("org_id")
        .eq("id", formData.clientId)
        .single();

      if (client?.org_id) {
        await supabase.from("tasks").insert(
          pbcTasks.map((task) => ({
            ...task,
            org_id: client.org_id,
            auto_created: true,
          }))
        );
      }

      toast.success("Engagement created successfully");
      onSuccess();
    } catch (error: any) {
      console.error("Error creating engagement:", error);
      toast.error("Failed to create engagement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Step 1: Select Client</h3>
          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID *</Label>
            <Input
              id="clientId"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              placeholder="Enter client ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessId">Business ID (optional)</Label>
            <Input
              id="businessId"
              value={formData.businessId}
              onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
              placeholder="Enter business ID if applicable"
            />
          </div>
          <Button onClick={() => setStep(2)}>Next</Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Step 2: Define Engagement</h3>
          <div className="space-y-2">
            <Label htmlFor="scope">Scope *</Label>
            <Textarea
              id="scope"
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              placeholder="Describe the scope of work..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feeType">Fee Type *</Label>
            <Select
              value={formData.feeType}
              onValueChange={(value: any) => setFormData({ ...formData, feeType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quote">Quote (₦) *</Label>
            <Input
              id="quote"
              type="number"
              value={formData.quote}
              onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
              placeholder="Enter quote amount"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)}>Next</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Step 3: Upload Documents</h3>
          <div className="space-y-2">
            <Label htmlFor="loeUrl">Letter of Engagement URL</Label>
            <Input
              id="loeUrl"
              value={formData.loeUrl}
              onChange={(e) => setFormData({ ...formData, loeUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authorityUrl">Authority to File URL</Label>
            <Input
              id="authorityUrl"
              value={formData.authorityUrl}
              onChange={(e) => setFormData({ ...formData, authorityUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Engagement
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
