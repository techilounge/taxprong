import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Engagement {
  id: string;
  scope: string | null;
  client?: {
    profile?: {
      name: string;
    };
    business?: {
      name: string;
    };
  };
}

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagements: Engagement[];
  onSubmit: (engagementId: string, amount: number) => Promise<any>;
}

export const CreateInvoiceDialog = ({
  open,
  onOpenChange,
  engagements,
  onSubmit,
}: CreateInvoiceDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedEngagement, setSelectedEngagement] = useState("");
  const [amount, setAmount] = useState("");
  const [platformFee, setPlatformFee] = useState(0);
  const [payout, setPayout] = useState(0);

  useEffect(() => {
    if (amount) {
      const amountNum = parseFloat(amount);
      const fee = amountNum * 0.15;
      setPlatformFee(fee);
      setPayout(amountNum - fee);
    } else {
      setPlatformFee(0);
      setPayout(0);
    }
  }, [amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEngagement || !amount) return;

    setLoading(true);
    try {
      await onSubmit(selectedEngagement, parseFloat(amount));
      onOpenChange(false);
      setSelectedEngagement("");
      setAmount("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="engagement">Engagement</Label>
            <Select value={selectedEngagement} onValueChange={setSelectedEngagement}>
              <SelectTrigger>
                <SelectValue placeholder="Select engagement" />
              </SelectTrigger>
              <SelectContent>
                {engagements.map((eng) => {
                  const clientName = eng.client?.profile?.name || 
                                   eng.client?.business?.name || 
                                   "Unknown";
                  return (
                    <SelectItem key={eng.id} value={eng.id}>
                      {clientName} - {eng.scope || "No scope"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Invoice Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {amount && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee (15%):</span>
                <span>₦{platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Your Payout:</span>
                <span className="text-green-600">₦{payout.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedEngagement || !amount}>
              {loading ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
