import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function DigitalEconomyCalculator() {
  const [digitalRevenue, setDigitalRevenue] = useState<number>(0);
  const [nigerianUsers, setNigerianUsers] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [serviceType, setServiceType] = useState<string>("");
  const [isVASP, setIsVASP] = useState<boolean>(false);
  const [hasLocalPresence, setHasLocalPresence] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const calculateDigitalTax = () => {
    if (digitalRevenue <= 0) {
      toast.error("Please enter valid revenue");
      return;
    }

    const userPercentage = totalUsers > 0 ? (nigerianUsers / totalUsers) * 100 : 0;

    // Significant Digital Presence threshold
    const hasSignificantPresence = nigerianUsers >= 100000 || userPercentage >= 25;

    // Digital Services Tax (6% WHT for non-residents)
    const digitalServicesTax = !hasLocalPresence ? (digitalRevenue * 6) / 100 : 0;

    // VASP compliance costs (₦5M registration + annual fees)
    const vaspCosts = isVASP ? 5000000 : 0;

    // Standard CIT if has local presence/PE
    let cit = 0;
    if (hasLocalPresence || hasSignificantPresence) {
      const assessableProfit = digitalRevenue * 0.25; // Simplified
      cit = (assessableProfit * 30) / 100;
    }

    // VAT on digital services (7.5%)
    const vat = (digitalRevenue * 7.5) / 100;

    const totalTax = digitalServicesTax + cit + vaspCosts + vat;

    setResult({
      digitalRevenue,
      digitalServicesTax,
      cit,
      vat,
      vaspCosts,
      totalTax,
      hasSignificantPresence,
      userPercentage,
      effectiveTaxRate: digitalRevenue > 0 ? (totalTax / digitalRevenue) * 100 : 0,
    });

    toast.success("Digital economy tax calculated");
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
            <Zap className="h-5 w-5" />
            Digital Economy Tax Calculator
          </CardTitle>
          <CardDescription>
            Calculate digital services tax, VASP compliance, and VAT
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="revenue">Digital Revenue from Nigeria (₦)</Label>
              <Input
                id="revenue"
                type="number"
                value={digitalRevenue}
                onChange={(e) => setDigitalRevenue(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="streaming">Streaming (video/music)</SelectItem>
                  <SelectItem value="saas">SaaS / Cloud Services</SelectItem>
                  <SelectItem value="gaming">Online Gaming</SelectItem>
                  <SelectItem value="ecommerce">E-commerce Platform</SelectItem>
                  <SelectItem value="advertising">Digital Advertising</SelectItem>
                  <SelectItem value="fintech">Fintech / Payment Services</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency / VASP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nigerianUsers">Nigerian Users</Label>
              <Input
                id="nigerianUsers"
                type="number"
                value={nigerianUsers}
                onChange={(e) => setNigerianUsers(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalUsers">Total Users (Worldwide)</Label>
              <Input
                id="totalUsers"
                type="number"
                value={totalUsers}
                onChange={(e) => setTotalUsers(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <Label>Business Characteristics</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="localPresence"
                checked={hasLocalPresence}
                onCheckedChange={(checked) => setHasLocalPresence(checked as boolean)}
              />
              <label htmlFor="localPresence" className="text-sm cursor-pointer">
                Has physical presence or PE in Nigeria
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="vasp"
                checked={isVASP}
                onCheckedChange={(checked) => setIsVASP(checked as boolean)}
              />
              <label htmlFor="vasp" className="text-sm cursor-pointer">
                Virtual Asset Service Provider (VASP) - cryptocurrency/blockchain
              </label>
            </div>
          </div>

          <Button onClick={calculateDigitalTax} className="w-full" size="lg">
            Calculate Digital Economy Tax
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          {result.hasSignificantPresence && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-orange-900">Significant Digital Presence Detected</p>
                    <p className="text-sm text-orange-800 mt-1">
                      Your business has {result.nigerianUsers.toLocaleString()} Nigerian users ({result.userPercentage.toFixed(1)}% of total).
                      This creates a taxable presence in Nigeria under 2025 rules.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.digitalServicesTax > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Digital Services Tax (WHT)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(result.digitalServicesTax)}
                  </p>
                  <p className="text-xs text-muted-foreground">6% on non-resident services</p>
                </CardContent>
              </Card>
            )}

            {result.cit > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Corporate Income Tax</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(result.cit)}</p>
                  <p className="text-xs text-muted-foreground">30% on attributable profits</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">VAT on Digital Services</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(result.vat)}</p>
                <p className="text-xs text-muted-foreground">7.5% rate</p>
              </CardContent>
            </Card>

            {result.vaspCosts > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-sm">VASP Compliance Costs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(result.vaspCosts)}
                  </p>
                  <p className="text-xs text-blue-600">Registration + annual fees</p>
                </CardContent>
              </Card>
            )}

            <Card className="md:col-span-2 bg-primary/5">
              <CardHeader>
                <CardTitle>Total Digital Economy Tax Liability</CardTitle>
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
        </>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 mb-2">Digital Economy Rules (2025)</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Significant Digital Presence: 100,000+ users OR 25%+ Nigerian market share</li>
            <li>• Digital Services WHT: 6% on payments to non-resident platforms</li>
            <li>• VAT: 7.5% applies to all digital services consumed in Nigeria</li>
            <li>• VASP Registration: Mandatory for cryptocurrency/blockchain businesses</li>
            <li>• E-invoicing: Mandatory for all digital transactions from 2026</li>
            <li>• Data localization: May be required for payment processors</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
