import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";

interface FreeZoneAnalysis {
  eligibleForFreeZone: boolean;
  freeZoneTax: number;
  standardTax: number;
  savings: number;
  ediEligible: boolean;
  ediIncentives: string[];
  recommendations: string[];
}

export default function FreeZone() {
  const { organization, loading: orgLoading } = useOrganization();
  const [businessId, setBusinessId] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("");
  
  // Form state
  const [revenue, setRevenue] = useState<number>(0);
  const [exportPercentage, setExportPercentage] = useState<number>(0);
  const [isManufacturing, setIsManufacturing] = useState<boolean>(false);
  const [hasProcessingLicense, setHasProcessingLicense] = useState<boolean>(false);
  const [freeZoneType, setFreeZoneType] = useState<string>("");
  const [sector, setSector] = useState<string>("");
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [capitalInvestment, setCapitalInvestment] = useState<number>(0);
  
  // EDI eligibility
  const [isLocalContent, setIsLocalContent] = useState<boolean>(false);
  const [isGreenTech, setIsGreenTech] = useState<boolean>(false);
  const [isInfrastructure, setIsInfrastructure] = useState<boolean>(false);
  
  const [analysis, setAnalysis] = useState<FreeZoneAnalysis | null>(null);

  const STANDARD_CIT_RATE = 30;
  const FREE_ZONE_CIT_RATE = 0; // 0% for qualifying activities
  const DEV_LEVY_RATE = 4;

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
      setSector(business.sector || "");
    }
  };

  const analyzeIncentives = () => {
    if (revenue <= 0) {
      toast.error("Please enter valid revenue");
      return;
    }

    // Free Zone Eligibility
    const meetsExportRequirement = exportPercentage >= 75;
    const hasValidLicense = hasProcessingLicense;
    const eligibleForFreeZone = meetsExportRequirement && hasValidLicense;

    // Calculate taxes
    const assessableProfit = revenue * 0.2; // Simplified assumption
    const standardCIT = (assessableProfit * STANDARD_CIT_RATE) / 100;
    const standardDevLevy = (assessableProfit * DEV_LEVY_RATE) / 100;
    const standardTax = standardCIT + standardDevLevy;

    const freeZoneTax = eligibleForFreeZone ? 0 : standardTax;
    const savings = standardTax - freeZoneTax;

    // EDI Eligibility Assessment
    const ediIncentives: string[] = [];
    let ediEligible = false;

    if (isManufacturing && employeeCount >= 50) {
      ediIncentives.push("Manufacturing Tax Holiday: 0% for 5 years");
      ediEligible = true;
    }

    if (isGreenTech) {
      ediIncentives.push("Renewable Energy Incentive: 10% CIT for 10 years");
      ediEligible = true;
    }

    if (isInfrastructure && capitalInvestment >= 100000000) {
      ediIncentives.push("Infrastructure Development: Tax holiday + accelerated capital allowances");
      ediEligible = true;
    }

    if (isLocalContent && sector === "oil_gas") {
      ediIncentives.push("Local Content Incentive: Additional 5% tax reduction");
      ediEligible = true;
    }

    if (exportPercentage >= 50 && exportPercentage < 75) {
      ediIncentives.push("Export Processing Incentive: 15% reduced CIT rate");
      ediEligible = true;
    }

    // Recommendations
    const recommendations: string[] = [];
    
    if (!eligibleForFreeZone && exportPercentage >= 50) {
      recommendations.push(`Increase export percentage from ${exportPercentage}% to 75% to qualify for Free Zone status`);
    }

    if (!hasProcessingLicense) {
      recommendations.push("Apply for Free Zone Processing License to access 0% CIT rate");
    }

    if (isManufacturing && employeeCount < 50) {
      recommendations.push(`Expand workforce to 50+ employees (current: ${employeeCount}) to qualify for Manufacturing EDI`);
    }

    if (!ediEligible) {
      recommendations.push("Consider qualifying activities for Economic Development Incentive (EDI)");
    }

    if (capitalInvestment < 100000000 && isInfrastructure) {
      recommendations.push("Infrastructure projects require minimum ₦100M capital investment for EDI");
    }

    setAnalysis({
      eligibleForFreeZone,
      freeZoneTax,
      standardTax,
      savings,
      ediEligible,
      ediIncentives,
      recommendations,
    });

    toast.success("Analysis completed");
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
      <div className="container mx-auto py-4 sm:py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Free Zones & EDI</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Analyze eligibility for Free Zone status and Economic Development Incentives
            </p>
          </div>
          <Badge variant="secondary" className="text-xs sm:text-sm">Nigeria Tax Act 2025</Badge>
        </div>

        {/* Info Banner */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-blue-900">Key Changes in 2025</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Free Zones: 0% CIT for qualifying export-oriented activities (75%+ exports)</li>
                  <li>• EDI replaces Pioneer Status: Targeted incentives for priority sectors</li>
                  <li>• New qualification criteria and stricter monitoring</li>
                  <li>• Development Levy applies even in Free Zones (with exemptions)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="assessment" className="space-y-4">
          <TabsList className="w-full grid grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="assessment" className="text-xs sm:text-sm">Assessment</TabsTrigger>
            <TabsTrigger value="comparison" className="text-xs sm:text-sm">Comparison</TabsTrigger>
            <TabsTrigger value="edi" className="text-xs sm:text-sm">EDI</TabsTrigger>
          </TabsList>

          <TabsContent value="assessment" className="space-y-4">
            {businessName && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {businessName} - Free Zone Assessment
                  </CardTitle>
                  <CardDescription>
                    Determine eligibility for Free Zone status and EDI incentives
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="revenue">Annual Revenue (₦)</Label>
                      <Input
                        id="revenue"
                        type="number"
                        value={revenue}
                        onChange={(e) => setRevenue(Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="exportPct">Export Percentage (%)</Label>
                      <Input
                        id="exportPct"
                        type="number"
                        min="0"
                        max="100"
                        value={exportPercentage}
                        onChange={(e) => setExportPercentage(Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Free Zone requires 75%+ exports
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="freeZoneType">Free Zone Type</Label>
                      <Select value={freeZoneType} onValueChange={setFreeZoneType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="export_processing">Export Processing Zone</SelectItem>
                          <SelectItem value="oil_gas">Oil & Gas Free Zone</SelectItem>
                          <SelectItem value="specialized">Specialized Economic Zone</SelectItem>
                          <SelectItem value="general">General Purpose Zone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sector">Business Sector</Label>
                      <Select value={sector} onValueChange={setSector}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sector" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="oil_gas">Oil & Gas</SelectItem>
                          <SelectItem value="technology">Technology/ICT</SelectItem>
                          <SelectItem value="agriculture">Agriculture</SelectItem>
                          <SelectItem value="renewable_energy">Renewable Energy</SelectItem>
                          <SelectItem value="infrastructure">Infrastructure</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employees">Number of Employees</Label>
                      <Input
                        id="employees"
                        type="number"
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="capital">Capital Investment (₦)</Label>
                      <Input
                        id="capital"
                        type="number"
                        value={capitalInvestment}
                        onChange={(e) => setCapitalInvestment(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <Label>Business Characteristics</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="manufacturing"
                          checked={isManufacturing}
                          onCheckedChange={(checked) => setIsManufacturing(checked as boolean)}
                        />
                        <label htmlFor="manufacturing" className="text-sm cursor-pointer">
                          Manufacturing activity with local value addition
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="license"
                          checked={hasProcessingLicense}
                          onCheckedChange={(checked) => setHasProcessingLicense(checked as boolean)}
                        />
                        <label htmlFor="license" className="text-sm cursor-pointer">
                          Holds valid Free Zone Processing License
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="localContent"
                          checked={isLocalContent}
                          onCheckedChange={(checked) => setIsLocalContent(checked as boolean)}
                        />
                        <label htmlFor="localContent" className="text-sm cursor-pointer">
                          Meets local content requirements (Nigeria oil & gas)
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="greenTech"
                          checked={isGreenTech}
                          onCheckedChange={(checked) => setIsGreenTech(checked as boolean)}
                        />
                        <label htmlFor="greenTech" className="text-sm cursor-pointer">
                          Renewable energy or green technology
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="infrastructure"
                          checked={isInfrastructure}
                          onCheckedChange={(checked) => setIsInfrastructure(checked as boolean)}
                        />
                        <label htmlFor="infrastructure" className="text-sm cursor-pointer">
                          Critical infrastructure development project
                        </label>
                      </div>
                    </div>
                  </div>

                  <Button onClick={analyzeIncentives} className="w-full" size="lg">
                    Analyze Eligibility
                  </Button>
                </CardContent>
              </Card>
            )}

            {analysis && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Zone Status */}
                <Card className={analysis.eligibleForFreeZone ? "border-green-500" : "border-orange-500"}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {analysis.eligibleForFreeZone ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                      )}
                      Free Zone Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analysis.eligibleForFreeZone ? (
                      <div className="space-y-2">
                        <Badge variant="default" className="bg-green-600">Eligible</Badge>
                        <p className="text-sm">
                          Your business qualifies for Free Zone status with 0% CIT on export activities.
                        </p>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm font-medium">Annual Tax Savings:</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(analysis.savings)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Badge variant="destructive">Not Eligible</Badge>
                        <p className="text-sm text-muted-foreground">
                          Your business does not currently meet Free Zone requirements.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* EDI Status */}
                <Card className={analysis.ediEligible ? "border-blue-500" : "border-gray-300"}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Economic Development Incentive (EDI)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analysis.ediEligible ? (
                      <div className="space-y-3">
                        <Badge variant="default" className="bg-blue-600">Eligible</Badge>
                        <p className="text-sm font-medium">Available Incentives:</p>
                        <ul className="space-y-2">
                          {analysis.ediIncentives.map((incentive, idx) => (
                            <li key={idx} className="text-sm bg-blue-50 p-2 rounded">
                              ✓ {incentive}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Badge variant="outline">Not Currently Eligible</Badge>
                        <p className="text-sm text-muted-foreground">
                          Consider restructuring to qualify for EDI programs.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recommendations */}
                {analysis.recommendations.length > 0 && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-primary">→</span>
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            {analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Tax Comparison Analysis</CardTitle>
                  <CardDescription>Standard taxation vs Free Zone incentives</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Standard Taxation</p>
                      <p className="text-3xl font-bold">{formatCurrency(analysis.standardTax)}</p>
                      <p className="text-xs">CIT 30% + Dev Levy 4%</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Free Zone Taxation</p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(analysis.freeZoneTax)}
                      </p>
                      <p className="text-xs">0% on qualifying activities</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Potential Savings</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(analysis.savings)}
                      </p>
                      <p className="text-xs">Annual tax reduction</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="edi" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Manufacturing EDI</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Benefit:</strong> Tax holiday for 3-5 years</p>
                  <p><strong>Eligibility:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Manufacturing with 30%+ local value addition</li>
                    <li>Minimum 50 employees</li>
                    <li>Export-oriented or import substitution</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Renewable Energy EDI</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Benefit:</strong> 10% reduced CIT for 10 years</p>
                  <p><strong>Eligibility:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Solar, wind, hydro power generation</li>
                    <li>Green technology manufacturing</li>
                    <li>Minimum ₦50M capital investment</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Infrastructure EDI</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Benefit:</strong> Tax holiday + accelerated allowances</p>
                  <p><strong>Eligibility:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Roads, railways, ports development</li>
                    <li>Minimum ₦100M capital investment</li>
                    <li>Pre-approval from Ministry of Finance</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Agriculture EDI</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Benefit:</strong> 15% reduced CIT + capital allowances</p>
                  <p><strong>Eligibility:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Large-scale farming (50+ hectares)</li>
                    <li>Agro-processing with 40%+ local content</li>
                    <li>Minimum 100 direct jobs created</li>
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
