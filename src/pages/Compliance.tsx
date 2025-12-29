import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PenaltyCalculator } from "@/components/compliance/PenaltyCalculator";
import { TaxCalendar } from "@/components/compliance/TaxCalendar";
import { Shield, Calendar, AlertTriangle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Compliance() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tax Compliance</h1>
            <p className="text-muted-foreground">
              Manage deadlines, calculate penalties, and stay compliant
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            Nigeria Tax Act 2025
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">In next 90 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                High Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Monthly Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">VAT, WHT, PAYE</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                Compliance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground">Good standing</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList className="w-full grid grid-cols-2 lg:w-auto lg:inline-flex">
            <TabsTrigger value="calendar" className="text-xs sm:text-sm">Tax Calendar</TabsTrigger>
            <TabsTrigger value="penalties" className="text-xs sm:text-sm">Penalty Calculator</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <TaxCalendar />
          </TabsContent>

          <TabsContent value="penalties" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <PenaltyCalculator />
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Penalty Changes (2025)</CardTitle>
                    <CardDescription>Significantly increased enforcement</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="border-l-4 border-destructive pl-4">
                      <h4 className="font-semibold text-sm">Late Filing</h4>
                      <p className="text-sm text-muted-foreground">
                        Increased from ₦25,000 to <span className="font-bold text-destructive">₦100,000</span> base penalty + 0.5% per month
                      </p>
                    </div>

                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-semibold text-sm">Late Payment</h4>
                      <p className="text-sm text-muted-foreground">
                        5% penalty + 2% interest per month (24% per annum)
                      </p>
                    </div>

                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-semibold text-sm">Understatement</h4>
                      <p className="text-sm text-muted-foreground">
                        20% of understated tax (up to 100% if willful) + potential criminal prosecution
                      </p>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h4 className="font-semibold text-sm">E-Invoice Non-Compliance</h4>
                      <p className="text-sm text-muted-foreground">
                        ₦100,000 per infraction (mandatory from Jan 2026)
                      </p>
                    </div>

                    <div className="border-l-4 border-red-600 pl-4">
                      <h4 className="font-semibold text-sm">Criminal Prosecution</h4>
                      <p className="text-sm text-muted-foreground">
                        Possible for serious violations: jail term up to 3 years or fine up to ₦10 million
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-sm">💡 Best Practices</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>• File and pay on time to avoid penalties</p>
                    <p>• Maintain proper documentation and records</p>
                    <p>• Register for e-invoicing before Jan 2026</p>
                    <p>• Use voluntary disclosure if errors found</p>
                    <p>• Engage tax professionals for complex matters</p>
                    <p>• Set up automated reminders for deadlines</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
