import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Factory, Landmark, Zap, Leaf } from "lucide-react";
import { OilGasCalculator } from "@/components/industry/OilGasCalculator";
import { BankingCalculator } from "@/components/industry/BankingCalculator";
import { DigitalEconomyCalculator } from "@/components/industry/DigitalEconomyCalculator";

export default function IndustryModules() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Industry-Specific Tax Modules</h1>
            <p className="text-muted-foreground">
              Specialized calculators for sector-specific tax rules
            </p>
          </div>
          <Badge variant="secondary">Nigeria Tax Act 2025</Badge>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Factory className="h-4 w-4" />
                Oil & Gas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Petroleum Profits Tax, royalties, gas flaring penalties
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Banking & Finance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Stamp duty on loan capital, special CIT rules
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Digital Economy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                VASP compliance, digital services tax, e-commerce
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="oil-gas" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="oil-gas">Oil & Gas</TabsTrigger>
            <TabsTrigger value="banking">Banking</TabsTrigger>
            <TabsTrigger value="digital">Digital Economy</TabsTrigger>
          </TabsList>

          <TabsContent value="oil-gas" className="space-y-4">
            <OilGasCalculator />
          </TabsContent>

          <TabsContent value="banking" className="space-y-4">
            <BankingCalculator />
          </TabsContent>

          <TabsContent value="digital" className="space-y-4">
            <DigitalEconomyCalculator />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
