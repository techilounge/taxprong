import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Factory } from "lucide-react";
import { toast } from "sonner";

export function OilGasCalculator() {
  const [productionVolume, setProductionVolume] = useState<number>(0);
  const [oilPrice, setOilPrice] = useState<number>(0);
  const [operatingCosts, setOperatingCosts] = useState<number>(0);
  const [waterDepth, setWaterDepth] = useState<string>("");
  const [localContent, setLocalContent] = useState<number>(0);
  const [gasFlared, setGasFlared] = useState<number>(0);
  const [result, setResult] = useState<any>(null);

  const calculateOilGasTax = () => {
    if (productionVolume <= 0 || oilPrice <= 0) {
      toast.error("Please enter valid production data");
      return;
    }

    const revenue = productionVolume * oilPrice;
    const netRevenue = revenue - operatingCosts;

    // Petroleum Profits Tax (PPT) rates
    let pptRate = 50; // Onshore default
    if (waterDepth === "shallow") pptRate = 50;
    else if (waterDepth === "deep") pptRate = 30;
    else if (waterDepth === "ultra_deep") pptRate = 10;

    const ppt = (netRevenue * pptRate) / 100;

    // Royalty rates
    let royaltyRate = 20; // Onshore default
    if (waterDepth === "shallow") royaltyRate = 18;
    else if (waterDepth === "deep") royaltyRate = 16;
    else if (waterDepth === "ultra_deep") royaltyRate = 12;

    const royalty = (revenue * royaltyRate) / 100;

    // Gas flaring penalty (₦2,000 per 1,000 scf flared)
    const gasPenalty = (gasFlared / 1000) * 2000;

    // Local content incentive (up to 5% reduction)
    const localContentIncentive = localContent >= 60 ? 0.05 : localContent >= 40 ? 0.03 : 0;
    const incentiveAmount = ppt * localContentIncentive;

    const totalTax = ppt + royalty + gasPenalty - incentiveAmount;

    setResult({
      revenue,
      netRevenue,
      ppt,
      pptRate,
      royalty,
      royaltyRate,
      gasPenalty,
      localContentIncentive: incentiveAmount,
      totalTax,
      effectiveTaxRate: revenue > 0 ? (totalTax / revenue) * 100 : 0,
    });

    toast.success("Oil & Gas tax calculated");
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
            <Factory className="h-5 w-5" />
            Oil & Gas Tax Calculator
          </CardTitle>
          <CardDescription>
            Calculate Petroleum Profits Tax, royalties, and penalties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="production">Production Volume (barrels)</Label>
              <Input
                id="production"
                type="number"
                value={productionVolume}
                onChange={(e) => setProductionVolume(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Oil Price per barrel (₦)</Label>
              <Input
                id="price"
                type="number"
                value={oilPrice}
                onChange={(e) => setOilPrice(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costs">Operating Costs (₦)</Label>
              <Input
                id="costs"
                type="number"
                value={operatingCosts}
                onChange={(e) => setOperatingCosts(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waterDepth">Water Depth Category</Label>
              <Select value={waterDepth} onValueChange={setWaterDepth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onshore">Onshore (PPT: 50%, Royalty: 20%)</SelectItem>
                  <SelectItem value="shallow">Shallow Water (PPT: 50%, Royalty: 18%)</SelectItem>
                  <SelectItem value="deep">Deep Water (PPT: 30%, Royalty: 16%)</SelectItem>
                  <SelectItem value="ultra_deep">Ultra Deep (PPT: 10%, Royalty: 12%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="localContent">Local Content % (0-100)</Label>
              <Input
                id="localContent"
                type="number"
                min="0"
                max="100"
                value={localContent}
                onChange={(e) => setLocalContent(Number(e.target.value))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                60%+: 5% incentive | 40-59%: 3% incentive
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flared">Gas Flared (1,000 scf)</Label>
              <Input
                id="flared"
                type="number"
                value={gasFlared}
                onChange={(e) => setGasFlared(Number(e.target.value))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Penalty: ₦2,000 per 1,000 scf
              </p>
            </div>
          </div>

          <Button onClick={calculateOilGasTax} className="w-full" size="lg">
            Calculate Oil & Gas Tax
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Petroleum Profits Tax</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(result.ppt)}</p>
              <p className="text-xs text-muted-foreground">{result.pptRate}% rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Royalty</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(result.royalty)}</p>
              <p className="text-xs text-muted-foreground">{result.royaltyRate}% rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Gas Flaring Penalty</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(result.gasPenalty)}
              </p>
            </CardContent>
          </Card>

          {result.localContentIncentive > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-sm">Local Content Incentive</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  -{formatCurrency(result.localContentIncentive)}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="md:col-span-3 bg-primary/5">
            <CardHeader>
              <CardTitle>Total Oil & Gas Tax Liability</CardTitle>
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
    </div>
  );
}
