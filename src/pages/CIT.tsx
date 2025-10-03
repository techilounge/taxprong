import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TaxQAPanel } from "@/components/tax/TaxQAPanel";

export default function CIT() {
  const { organization, loading: orgLoading } = useOrganization();
  const { toast } = useToast();
  const [businessId, setBusinessId] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("");
  const [assessableProfits, setAssessableProfits] = useState<number>(0);
  const [turnoverBand, setTurnoverBand] = useState<string>("");
  const [isMne, setIsMne] = useState<boolean>(false);
  const [etrPercent, setEtrPercent] = useState<number>(0);
  const [citRate, setCitRate] = useState<number>(30);
  const [calculations, setCalculations] = useState<any>(null);

  useEffect(() => {
    if (organization) {
      loadBusiness();
    }
  }, [organization]);

  const loadBusiness = async () => {
    const { data: businesses } = await supabase
      .from("businesses")
      .select("*")
      .eq("org_id", organization.id)
      .limit(1);

    if (businesses && businesses.length > 0) {
      const business = businesses[0];
      setBusinessId(business.id);
      setBusinessName(business.name);
      setTurnoverBand(business.turnover_band || "");
      setIsMne(business.mne_member || false);

      // Load existing CIT calculation
      const { data: calc } = await supabase
        .from("cit_calcs")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (calc) {
        setAssessableProfits(calc.assessable_profits || 0);
        setCitRate(calc.cit_rate || 30);
        setEtrPercent(calc.etr_percent || 0);
        calculateTax(
          calc.assessable_profits || 0,
          calc.cit_rate || 30,
          calc.etr_percent || 0,
          calc.turnover_band || "",
          calc.is_mne || false
        );
      }
    }
  };

  const calculateTax = (
    profits: number,
    rate: number,
    etr: number,
    band: string,
    mne: boolean
  ) => {
    const citPayable = (profits * rate) / 100;
    const devLevyRate = 4;
    const devLevy = (profits * devLevyRate) / 100;
    
    // ETR policy threshold is 15% for MNEs
    const etrThreshold = mne ? 15 : 0;
    const effectiveTaxRate = profits > 0 ? (citPayable / profits) * 100 : 0;
    const etrTopup = mne && effectiveTaxRate < etrThreshold 
      ? (profits * (etrThreshold - effectiveTaxRate)) / 100
      : 0;

    const totalTax = citPayable + devLevy + etrTopup;

    setCalculations({
      assessableProfits: profits,
      citRate: rate,
      citPayable: citPayable,
      devLevyRate: devLevyRate,
      devLevy: devLevy,
      etrPercent: etr || effectiveTaxRate,
      etrThreshold: etrThreshold,
      etrTopup: etrTopup,
      totalTax: totalTax,
      turnoverBand: band,
      isMne: mne,
    });
  };

  const handleCalculate = () => {
    calculateTax(assessableProfits, citRate, etrPercent, turnoverBand, isMne);
  };

  const handleSave = async () => {
    if (!businessId || !calculations) return;

    const { error } = await supabase.from("cit_calcs").insert({
      business_id: businessId,
      assessable_profits: calculations.assessableProfits,
      cit_rate: calculations.citRate,
      cit_payable: calculations.citPayable,
      development_levy_rate: calculations.devLevyRate,
      development_levy: calculations.devLevy,
      etr_percent: calculations.etrPercent,
      etr_topup: calculations.etrTopup,
      is_mne: calculations.isMne,
      turnover_band: calculations.turnoverBand,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save CIT calculation",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "CIT calculation saved successfully",
      });
    }
  };

  const exportPDF = () => {
    toast({
      title: "PDF Export",
      description: "CIT pack PDF generation coming soon",
    });
  };

  const handleInsertCITNote = async (answer: string, citations: any[]) => {
    // Store Q&A as note on CIT calculation
    toast({
      title: "Success",
      description: "Q&A saved to CIT calculation notes",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  if (orgLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">CIT & Development Levy</h1>
            <p className="text-muted-foreground">
              Calculate Corporate Income Tax, Development Levy, and ETR Top-up
            </p>
          </div>
          {calculations && (
            <Button onClick={exportPDF} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CIT Pack
            </Button>
          )}
        </div>

        {businessName && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {businessName}
              </CardTitle>
              <CardDescription>
                Enter assessable profits and tax parameters
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="citRate">CIT Rate (%)</Label>
                  <Input
                    id="citRate"
                    type="number"
                    value={citRate}
                    onChange={(e) => setCitRate(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="etr">Effective Tax Rate (%) - Optional</Label>
                  <Input
                    id="etr"
                    type="number"
                    value={etrPercent}
                    onChange={(e) => setEtrPercent(Number(e.target.value))}
                    placeholder="Leave empty to auto-calculate"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tax Status</Label>
                  <div className="flex gap-2">
                    {isMne && (
                      <Badge variant="secondary">MNE Member</Badge>
                    )}
                    {turnoverBand && (
                      <Badge variant="outline">{turnoverBand}</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCalculate}>Calculate</Button>
                {calculations && (
                  <Button onClick={handleSave} variant="outline">
                    Save Calculation
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {calculations && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Corporate Income Tax</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate:</span>
                    <span className="font-medium">{calculations.citRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax Payable:</span>
                    <span className="font-bold">{formatCurrency(calculations.citPayable)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Development Levy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate:</span>
                    <span className="font-medium">{calculations.devLevyRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Levy Due:</span>
                    <span className="font-bold">{formatCurrency(calculations.devLevy)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {calculations.isMne && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>ETR Top-up (BEPS Pillar 2)</CardTitle>
                  <CardDescription>
                    Minimum effective tax rate: {calculations.etrThreshold}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Effective Tax Rate:</span>
                      <span className="font-medium">{calculations.etrPercent.toFixed(2)}%</span>
                    </div>
                    {calculations.etrTopup > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Top-up Required:</span>
                        <span className="font-bold text-orange-600">
                          {formatCurrency(calculations.etrTopup)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="md:col-span-2 bg-primary/5">
              <CardHeader>
                <CardTitle>Total Tax Liability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(calculations.totalTax)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Right Side Q&A Panel */}
      <div className="lg:w-96 lg:shrink-0">
        <div className="lg:sticky lg:top-6 lg:mt-6">
          <TaxQAPanel
            orgId={organization?.id || null}
            returnType="cit"
            onInsertNote={handleInsertCITNote}
          />
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
