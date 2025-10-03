import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, AlertTriangle, Calculator } from "lucide-react";
import { toast } from "sonner";

interface TaxResult {
  incomeType: string;
  grossIncome: number;
  whtRate: number;
  whtAmount: number;
  netIncome: number;
  hasPE: boolean;
  peReason?: string;
  treatyBenefit: number;
  effectiveRate: number;
}

export default function NonResidentTax() {
  const [incomeType, setIncomeType] = useState<string>("");
  const [grossIncome, setGrossIncome] = useState<number>(0);
  const [country, setCountry] = useState<string>("");
  const [hasTreaty, setHasTreaty] = useState<boolean>(false);
  const [treatyRate, setTreatyRate] = useState<number>(0);
  
  // PE determination factors
  const [hasFixedPlace, setHasFixedPlace] = useState<boolean>(false);
  const [hasDependentAgent, setHasDependentAgent] = useState<boolean>(false);
  const [durationInNigeria, setDurationInNigeria] = useState<number>(0);
  const [providesServices, setProvidesServices] = useState<boolean>(false);
  const [hasDigitalPresence, setHasDigitalPresence] = useState<boolean>(false);
  
  const [result, setResult] = useState<TaxResult | null>(null);

  // Withholding tax rates for non-residents (2025)
  const WHT_RATES = {
    dividends: 10,
    interest: 10,
    royalties: 10,
    rent: 10,
    technical_services: 10,
    management_fees: 10,
    digital_services: 6, // New: Digital services tax
    professional_fees: 10,
    contract_payments: 5,
  };

  const calculateTax = () => {
    if (!incomeType || grossIncome <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Determine PE status
    let hasPE = false;
    let peReason = "";

    if (hasFixedPlace) {
      hasPE = true;
      peReason = "Fixed place of business in Nigeria";
    } else if (hasDependentAgent) {
      hasPE = true;
      peReason = "Dependent agent habitually concluding contracts";
    } else if (durationInNigeria >= 183) {
      hasPE = true;
      peReason = "Physical presence exceeds 183 days (service PE)";
    } else if (providesServices && durationInNigeria >= 90) {
      hasPE = true;
      peReason = "Furnishing services through employees exceeds 90 days";
    } else if (hasDigitalPresence && incomeType === "digital_services") {
      hasPE = true;
      peReason = "Significant digital presence (new 2025 rules)";
    }

    // Base WHT rate
    let whtRate = WHT_RATES[incomeType as keyof typeof WHT_RATES] || 10;

    // Apply treaty relief if applicable
    let effectiveRate = whtRate;
    let treatyBenefit = 0;

    if (hasTreaty && treatyRate > 0 && treatyRate < whtRate) {
      effectiveRate = treatyRate;
      treatyBenefit = ((whtRate - treatyRate) / 100) * grossIncome;
    }

    const whtAmount = (grossIncome * effectiveRate) / 100;
    const netIncome = grossIncome - whtAmount;

    setResult({
      incomeType,
      grossIncome,
      whtRate,
      whtAmount,
      netIncome,
      hasPE,
      peReason,
      treatyBenefit,
      effectiveRate,
    });

    toast.success("Tax calculation completed");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Non-Resident Taxation</h1>
            <p className="text-muted-foreground">
              Calculate withholding tax and assess Permanent Establishment (PE) status
            </p>
          </div>
          <Badge variant="secondary">Nigeria Tax Act 2025</Badge>
        </div>

        {/* Alert Banner */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-orange-900">Expanded Non-Resident Rules (2025)</p>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Digital services: 6% WHT on payments to non-resident digital platforms</li>
                  <li>• Indirect transfers: Tax on disposal of shares if 50%+ value from Nigerian assets</li>
                  <li>• Service PE: 90 days threshold (down from 183)</li>
                  <li>• Significant digital presence creates PE liability</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="calculator" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calculator">Tax Calculator</TabsTrigger>
            <TabsTrigger value="pe-test">PE Assessment</TabsTrigger>
            <TabsTrigger value="treaties">Tax Treaties</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Non-Resident Withholding Tax Calculator
                </CardTitle>
                <CardDescription>
                  Calculate WHT on payments to non-residents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="incomeType">Income Type *</Label>
                    <Select value={incomeType} onValueChange={setIncomeType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select income type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dividends">Dividends (10%)</SelectItem>
                        <SelectItem value="interest">Interest (10%)</SelectItem>
                        <SelectItem value="royalties">Royalties (10%)</SelectItem>
                        <SelectItem value="rent">Rent (10%)</SelectItem>
                        <SelectItem value="technical_services">Technical Services (10%)</SelectItem>
                        <SelectItem value="management_fees">Management Fees (10%)</SelectItem>
                        <SelectItem value="digital_services">Digital Services (6% - New)</SelectItem>
                        <SelectItem value="professional_fees">Professional Fees (10%)</SelectItem>
                        <SelectItem value="contract_payments">Contract Payments (5%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grossIncome">Gross Payment Amount (₦) *</Label>
                    <Input
                      id="grossIncome"
                      type="number"
                      value={grossIncome}
                      onChange={(e) => setGrossIncome(Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country of Residence</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="china">China</SelectItem>
                        <SelectItem value="south_africa">South Africa</SelectItem>
                        <SelectItem value="netherlands">Netherlands</SelectItem>
                        <SelectItem value="france">France</SelectItem>
                        <SelectItem value="canada">Canada</SelectItem>
                        <SelectItem value="singapore">Singapore</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="treaty"
                        checked={hasTreaty}
                        onCheckedChange={(checked) => setHasTreaty(checked as boolean)}
                      />
                      <label htmlFor="treaty" className="text-sm cursor-pointer">
                        Tax treaty applies
                      </label>
                    </div>
                    {hasTreaty && (
                      <Input
                        type="number"
                        placeholder="Treaty WHT rate (%)"
                        value={treatyRate}
                        onChange={(e) => setTreatyRate(Number(e.target.value))}
                      />
                    )}
                  </div>
                </div>

                <Button onClick={calculateTax} className="w-full" size="lg">
                  Calculate Withholding Tax
                </Button>
              </CardContent>
            </Card>

            {result && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Gross Payment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(result.grossIncome)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">WHT Deduction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(result.whtAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.effectiveRate}% rate
                      {result.treatyBenefit > 0 && " (treaty relief applied)"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Net Payment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(result.netIncome)}
                    </p>
                  </CardContent>
                </Card>

                {result.treatyBenefit > 0 && (
                  <Card className="md:col-span-3 bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium">Treaty Benefit</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(result.treatyBenefit)} saved
                      </p>
                      <p className="text-xs text-green-600">
                        Reduced from {result.whtRate}% to {result.effectiveRate}%
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pe-test" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Permanent Establishment (PE) Test
                </CardTitle>
                <CardDescription>
                  Determine if non-resident has taxable presence in Nigeria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>PE Indicators</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fixedPlace"
                      checked={hasFixedPlace}
                      onCheckedChange={(checked) => setHasFixedPlace(checked as boolean)}
                    />
                    <label htmlFor="fixedPlace" className="text-sm cursor-pointer">
                      Fixed place of business in Nigeria (office, branch, factory)
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agent"
                      checked={hasDependentAgent}
                      onCheckedChange={(checked) => setHasDependentAgent(checked as boolean)}
                    />
                    <label htmlFor="agent" className="text-sm cursor-pointer">
                      Dependent agent habitually concluding contracts
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="services"
                      checked={providesServices}
                      onCheckedChange={(checked) => setProvidesServices(checked as boolean)}
                    />
                    <label htmlFor="services" className="text-sm cursor-pointer">
                      Furnishing services through employees/personnel
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="digital"
                      checked={hasDigitalPresence}
                      onCheckedChange={(checked) => setHasDigitalPresence(checked as boolean)}
                    />
                    <label htmlFor="digital" className="text-sm cursor-pointer">
                      Significant digital presence (new 2025 rule)
                    </label>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="duration">Days in Nigeria (past 12 months)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={durationInNigeria}
                      onChange={(e) => setDurationInNigeria(Number(e.target.value))}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Service PE: 90 days threshold | General PE: 183 days
                    </p>
                  </div>
                </div>

                <Button onClick={calculateTax} className="w-full">
                  Assess PE Status
                </Button>

                {result && (
                  <Card className={result.hasPE ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {result.hasPE ? (
                            <>
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                              <p className="font-semibold text-red-900">PE Established</p>
                            </>
                          ) : (
                            <>
                              <Globe className="h-5 w-5 text-green-600" />
                              <p className="font-semibold text-green-900">No PE</p>
                            </>
                          )}
                        </div>
                        {result.peReason && (
                          <p className="text-sm">{result.peReason}</p>
                        )}
                        {result.hasPE && (
                          <div className="pt-2 border-t">
                            <p className="text-sm font-medium">Tax Implications:</p>
                            <ul className="text-sm space-y-1 mt-1">
                              <li>• Subject to Nigerian CIT on attributable profits</li>
                              <li>• Must file annual CIT returns</li>
                              <li>• Transfer pricing documentation required</li>
                              <li>• WHT credit available against CIT liability</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="treaties" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Active Tax Treaties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium">Nigeria has double taxation agreements with:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>United Kingdom</li>
                    <li>South Africa</li>
                    <li>Netherlands</li>
                    <li>France</li>
                    <li>Canada</li>
                    <li>China</li>
                    <li>Belgium</li>
                    <li>Romania</li>
                    <li>Pakistan</li>
                    <li>Singapore</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Treaty Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Typical reduced WHT rates:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Dividends: 7.5% - 15%</li>
                    <li>Interest: 7.5% - 12.5%</li>
                    <li>Royalties: 7.5% - 15%</li>
                  </ul>
                  <p className="pt-2"><strong>Requirements:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Valid tax residency certificate</li>
                    <li>Beneficial ownership test</li>
                    <li>Principal purpose test (PPT)</li>
                    <li>Anti-treaty shopping provisions</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
