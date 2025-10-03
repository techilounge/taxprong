import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Landmark } from "lucide-react";
import { toast } from "sonner";

export function BankingCalculator() {
  const [loanCapital, setLoanCapital] = useState<number>(0);
  const [assessableProfits, setAssessableProfits] = useState<number>(0);
  const [totalAssets, setTotalAssets] = useState<number>(0);
  const [result, setResult] = useState<any>(null);

  const calculateBankingTax = () => {
    if (assessableProfits <= 0) {
      toast.error("Please enter valid profit figures");
      return;
    }

    // Standard CIT for banks
    const citRate = 30;
    const cit = (assessableProfits * citRate) / 100;

    // Development Levy
    const devLevyRate = 4;
    const devLevy = (assessableProfits * devLevyRate) / 100;

    // Stamp duty on loan capital (0.75% under 2025 reforms)
    const stampDutyRate = 0.75;
    const stampDuty = (loanCapital * stampDutyRate) / 100;

    // Asset-based levy for systemically important banks (0.5% if assets > ₦500B)
    const assetLevy = totalAssets > 500000000000 ? (totalAssets * 0.005) / 100 : 0;

    const totalTax = cit + devLevy + stampDuty + assetLevy;

    setResult({
      cit,
      citRate,
      devLevy,
      devLevyRate,
      stampDuty,
      stampDutyRate,
      assetLevy,
      totalTax,
      effectiveTaxRate: assessableProfits > 0 ? (totalTax / assessableProfits) * 100 : 0,
    });

    toast.success("Banking tax calculated");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Banking & Finance Tax Calculator
          </CardTitle>
          <CardDescription>
            Calculate CIT, stamp duty on loan capital, and asset-based levies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profits">Assessable Profits (₦)</Label>
              <Input
                id="profits"
                type="number"
                value={assessableProfits}
                onChange={(e) => setAssessableProfits(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanCapital">Loan Capital Issued (₦)</Label>
              <Input
                id="loanCapital"
                type="number"
                value={loanCapital}
                onChange={(e) => setLoanCapital(Number(e.target.value))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Stamp duty: 0.75% on loan capital
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="assets">Total Assets (₦)</Label>
              <Input
                id="assets"
                type="number"
                value={totalAssets}
                onChange={(e) => setTotalAssets(Number(e.target.value))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Systemically important banks (assets &gt; ₦500B): 0.005% levy
              </p>
            </div>
          </div>

          <Button onClick={calculateBankingTax} className="w-full" size="lg">
            Calculate Banking Tax
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Corporate Income Tax</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(result.cit)}</p>
              <p className="text-xs text-muted-foreground">{result.citRate}% rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Development Levy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(result.devLevy)}</p>
              <p className="text-xs text-muted-foreground">{result.devLevyRate}% rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Stamp Duty (Loan Capital)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(result.stampDuty)}
              </p>
              <p className="text-xs text-muted-foreground">
                {result.stampDutyRate}% on loan capital (2025 rate)
              </p>
            </CardContent>
          </Card>

          {result.assetLevy > 0 && (
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-sm">Systemic Bank Levy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(result.assetLevy)}
                </p>
                <p className="text-xs text-red-600">0.005% on total assets</p>
              </CardContent>
            </Card>
          )}

          <Card className="md:col-span-2 bg-primary/5">
            <CardHeader>
              <CardTitle>Total Banking Tax Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(result.totalTax)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Effective tax rate: {result.effectiveTaxRate.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 mb-2">Key Banking Tax Rules (2025)</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Stamp duty on loan capital increased to 0.75% (was 0.125%)</li>
            <li>• New systemic bank levy for institutions with assets over ₦500B</li>
            <li>• Interest income on government securities remains exempt</li>
            <li>• Development Levy applies to all banks</li>
            <li>• Enhanced disclosure requirements for offshore transactions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
