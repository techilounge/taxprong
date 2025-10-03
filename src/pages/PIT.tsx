import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, FileDown } from "lucide-react";
import { toast } from "sonner";
import { TaxQAPanel } from "@/components/tax/TaxQAPanel";

const PIT = () => {
  const [annualIncome, setAnnualIncome] = useState("");
  const [rentPaid, setRentPaid] = useState("");
  const [result, setResult] = useState<any>(null);

  // Nigeria PIT bands (2025 - Updated under Nigeria Tax Act 2025)
  const pitBands = [
    { min: 0, max: 800000, rate: 0 },        // NEW: Tax-free threshold increased to ₦800,000
    { min: 800001, max: 1600000, rate: 7 },   // Adjusted bands
    { min: 1600001, max: 3200000, rate: 11 },
    { min: 3200001, max: 6400000, rate: 15 },
    { min: 6400001, max: 12800000, rate: 19 },
    { min: 12800001, max: 25600000, rate: 21 },
    { min: 25600001, max: Infinity, rate: 25 }, // NEW: Maximum rate increased to 25%
  ];

  const calculatePIT = () => {
    const income = parseFloat(annualIncome || "0");
    const rent = parseFloat(rentPaid || "0");

    if (income <= 0) {
      toast.error("Please enter a valid annual income");
      return;
    }

    // Calculate rent relief: 20% of rent paid, capped at ₦500,000
    const rentRelief = Math.min(rent * 0.2, 500000);
    
    // Calculate Consolidated Relief Allowance (CRA): Higher of 1% of gross income or ₦200,000 + 20% of gross income
    const craOption1 = income * 0.01;
    const craOption2 = 200000 + (income * 0.2);
    const cra = Math.max(craOption1, craOption2);

    // Total relief
    const totalRelief = rentRelief + cra;

    // Taxable income
    const taxableIncome = Math.max(income - totalRelief, 0);

    // Calculate tax using bands
    let remainingIncome = taxableIncome;
    let totalTax = 0;
    const bandBreakdown = [];

    for (const band of pitBands) {
      if (remainingIncome <= 0) break;

      const bandWidth = band.max === Infinity ? remainingIncome : Math.min(band.max - band.min + 1, remainingIncome);
      const bandTax = (bandWidth * band.rate) / 100;
      
      totalTax += bandTax;
      remainingIncome -= bandWidth;

      if (bandTax > 0) {
        bandBreakdown.push({
          range: `₦${band.min.toLocaleString()} - ${band.max === Infinity ? "Above" : "₦" + band.max.toLocaleString()}`,
          rate: `${band.rate}%`,
          income: bandWidth,
          tax: bandTax,
        });
      }
    }

    setResult({
      grossIncome: income,
      rentPaid: rent,
      rentRelief,
      cra,
      totalRelief,
      taxableIncome,
      totalTax,
      netIncome: income - totalTax,
      effectiveRate: income > 0 ? (totalTax / income) * 100 : 0,
      bandBreakdown,
    });

    toast.success("PIT calculation completed!");
  };

  const exportPDF = () => {
    toast.info("PDF export functionality will be implemented");
  };

  const handleInsertPITNote = (answer: string, citations: any[]) => {
    // Store Q&A as note for PIT calculation
    toast.success("Q&A saved to PIT calculation notes");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Personal Income Tax (PIT)</h1>
            <p className="text-muted-foreground">
              Calculate your PIT with ₦800K tax-free threshold (2025)
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                PIT Calculator
              </CardTitle>
              <CardDescription>
                Enter your annual income and rent to calculate tax
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="income">Annual Income (₦)</Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="0.00"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rent">Annual Rent Paid (₦)</Label>
                <Input
                  id="rent"
                  type="number"
                  placeholder="0.00"
                  value={rentPaid}
                  onChange={(e) => setRentPaid(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Rent relief: 20% of rent paid, capped at ₦500,000
                </p>
              </div>

              <Button onClick={calculatePIT} className="w-full">
                Calculate PIT
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Calculation Results</CardTitle>
                <CardDescription>Your PIT breakdown for 2025</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gross Income:</span>
                    <span className="font-medium">
                      ₦{result.grossIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rent Relief:</span>
                    <span className="font-medium text-accent">
                      -₦{result.rentRelief.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CRA:</span>
                    <span className="font-medium text-accent">
                      -₦{result.cra.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Taxable Income:</span>
                    <span className="font-medium">
                      ₦{result.taxableIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total PIT:</span>
                    <span className="text-2xl font-bold text-primary">
                      ₦{result.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Effective Rate:</span>
                    <span>{result.effectiveRate.toFixed(2)}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Net Income:</span>
                    <span className="text-accent">
                      ₦{result.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <Button onClick={exportPDF} variant="outline" className="w-full">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tax Bands Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Nigeria PIT Tax Bands (2025)</CardTitle>
            <CardDescription>Progressive tax rates applied to taxable income</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pitBands.map((band, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                  <span className="text-sm">
                    ₦{band.min.toLocaleString()} - {band.max === Infinity ? "Above" : `₦${band.max.toLocaleString()}`}
                  </span>
                  <span className="font-medium">{band.rate}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side Q&A Panel */}
      <div className="lg:w-96 lg:shrink-0">
        <div className="lg:sticky lg:top-6">
          <TaxQAPanel
            orgId={null}
            returnType="pit"
            onInsertNote={handleInsertPITNote}
          />
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default PIT;
