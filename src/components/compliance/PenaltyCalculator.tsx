import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calculator } from "lucide-react";

interface PenaltyResult {
  basePenalty: number;
  interest: number;
  additionalPenalty: number;
  totalPenalty: number;
  description: string;
}

export function PenaltyCalculator() {
  const [violationType, setViolationType] = useState<string>("");
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [daysLate, setDaysLate] = useState<number>(0);
  const [result, setResult] = useState<PenaltyResult | null>(null);

  const calculatePenalty = () => {
    if (!violationType || taxAmount <= 0) {
      return;
    }

    let basePenalty = 0;
    let interest = 0;
    let additionalPenalty = 0;
    let description = "";

    const INTEREST_RATE_PER_MONTH = 0.02; // 2% per month (24% per annum)

    switch (violationType) {
      case "late_filing":
        // Late filing: ₦100,000 + 0.5% of tax per month
        basePenalty = 100000;
        const monthsLate = Math.ceil(daysLate / 30);
        additionalPenalty = (taxAmount * 0.005 * monthsLate);
        description = `₦100,000 base penalty + 0.5% per month (${monthsLate} months)`;
        break;

      case "late_payment":
        // Late payment: 5% of unpaid tax + 2% interest per month
        basePenalty = taxAmount * 0.05;
        interest = taxAmount * INTEREST_RATE_PER_MONTH * Math.ceil(daysLate / 30);
        description = `5% of unpaid tax + 2% interest per month`;
        break;

      case "understatement":
        // Understatement: 20% of understated tax (up to 100% if willful)
        basePenalty = taxAmount * 0.20;
        description = "20% of understated amount (may increase to 100% if willful)";
        break;

      case "non_compliance":
        // Failure to register, maintain records, etc.
        basePenalty = 500000; // Up to ₦500,000
        description = "Up to ₦500,000 for non-compliance with tax obligations";
        break;

      case "incorrect_return":
        // Incorrect return: ₦50,000 + 5% of tax
        basePenalty = 50000 + (taxAmount * 0.05);
        description = "₦50,000 + 5% of tax due";
        break;

      case "late_vat_return":
        // Late VAT return: ₦100,000 per month
        additionalPenalty = 100000 * Math.ceil(daysLate / 30);
        description = `₦100,000 per month (${Math.ceil(daysLate / 30)} months)`;
        break;

      case "einvoice_non_compliance":
        // E-invoice non-compliance: ₦100,000 per infraction
        basePenalty = 100000;
        description = "₦100,000 per e-invoice infraction";
        break;

      default:
        break;
    }

    const totalPenalty = basePenalty + interest + additionalPenalty;

    setResult({
      basePenalty,
      interest,
      additionalPenalty,
      totalPenalty,
      description,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Penalty Calculator
        </CardTitle>
        <CardDescription>
          Calculate penalties under Nigeria Tax Act 2025 (significantly increased)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="violationType">Violation Type</Label>
          <Select value={violationType} onValueChange={setViolationType}>
            <SelectTrigger>
              <SelectValue placeholder="Select violation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="late_filing">Late Filing of Returns</SelectItem>
              <SelectItem value="late_payment">Late Payment of Tax</SelectItem>
              <SelectItem value="understatement">Understatement of Tax</SelectItem>
              <SelectItem value="non_compliance">Non-Compliance (Registration, Records)</SelectItem>
              <SelectItem value="incorrect_return">Incorrect Return</SelectItem>
              <SelectItem value="late_vat_return">Late VAT Return</SelectItem>
              <SelectItem value="einvoice_non_compliance">E-Invoice Non-Compliance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxAmount">Tax Amount (₦)</Label>
          <Input
            id="taxAmount"
            type="number"
            value={taxAmount}
            onChange={(e) => setTaxAmount(Number(e.target.value))}
            placeholder="Enter tax amount"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="daysLate">Days Late</Label>
          <Input
            id="daysLate"
            type="number"
            value={daysLate}
            onChange={(e) => setDaysLate(Number(e.target.value))}
            placeholder="Number of days overdue"
          />
        </div>

        <Button onClick={calculatePenalty} className="w-full">
          <Calculator className="mr-2 h-4 w-4" />
          Calculate Penalty
        </Button>

        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{result.description}</p>
              
              {result.basePenalty > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Base Penalty:</span>
                  <span className="font-medium">{formatCurrency(result.basePenalty)}</span>
                </div>
              )}
              
              {result.interest > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Interest:</span>
                  <span className="font-medium">{formatCurrency(result.interest)}</span>
                </div>
              )}
              
              {result.additionalPenalty > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Additional Penalty:</span>
                  <span className="font-medium">{formatCurrency(result.additionalPenalty)}</span>
                </div>
              )}
            </div>

            <Card className="bg-destructive/10 border-destructive">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Total Penalty</p>
                    <Badge variant="destructive" className="mt-1">2025 Rate</Badge>
                  </div>
                  <span className="text-2xl font-bold text-destructive">
                    {formatCurrency(result.totalPenalty)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>⚠️ Penalties under the 2025 tax reforms have significantly increased.</p>
              <p>• Late filing: Now ₦100,000 base (was ₦25,000)</p>
              <p>• Interest: 2% per month (24% per annum)</p>
              <p>• Criminal prosecution possible for serious violations</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
