import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { TaxQAPanel } from "@/components/tax/TaxQAPanel";

interface CGTEvent {
  id?: string;
  asset_type: string;
  proceeds: number;
  cost: number;
  gain: number;
  exempt_reason?: string;
  reinvest_amount?: number;
  legal_ref?: string;
}

export default function CGT() {
  const { organization, loading: orgLoading } = useOrganization();
  const [businessId, setBusinessId] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("");
  const [events, setEvents] = useState<CGTEvent[]>([]);
  
  // Form state
  const [assetType, setAssetType] = useState<string>("");
  const [proceeds, setProceeds] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [reinvestAmount, setReinvestAmount] = useState<number>(0);
  const [exemptReason, setExemptReason] = useState<string>("");
  const [legalRef, setLegalRef] = useState<string>("");

  const CGT_RATE = 30; // New 2025 rate

  useEffect(() => {
    if (organization) {
      loadBusiness();
    }
  }, [organization]);

  useEffect(() => {
    if (businessId) {
      loadEvents();
    }
  }, [businessId]);

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
    }
  };

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from("cgt_events")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load CGT events");
      return;
    }

    setEvents(data || []);
  };

  const calculateGain = () => {
    const gain = proceeds - cost - (reinvestAmount || 0);
    return Math.max(gain, 0);
  };

  const calculateTax = () => {
    const gain = calculateGain();
    return (gain * CGT_RATE) / 100;
  };

  const handleAddEvent = async () => {
    if (!assetType || proceeds <= 0 || cost <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    const gain = calculateGain();

    const { error } = await supabase.from("cgt_events").insert({
      business_id: businessId,
      asset_type: assetType,
      proceeds,
      cost,
      gain,
      reinvest_amount: reinvestAmount || null,
      exempt_reason: exemptReason || null,
      legal_ref: legalRef || null,
    });

    if (error) {
      toast.error("Failed to add CGT event");
      return;
    }

    toast.success("CGT event added successfully");
    loadEvents();
    
    // Reset form
    setAssetType("");
    setProceeds(0);
    setCost(0);
    setReinvestAmount(0);
    setExemptReason("");
    setLegalRef("");
  };

  const handleDeleteEvent = async (id: string) => {
    const { error } = await supabase
      .from("cgt_events")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete CGT event");
      return;
    }

    toast.success("CGT event deleted");
    loadEvents();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const totalGain = events.reduce((sum, event) => sum + (event.gain || 0), 0);
  const totalTax = (totalGain * CGT_RATE) / 100;

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
              <h1 className="text-3xl font-bold">Capital Gains Tax (CGT)</h1>
              <p className="text-muted-foreground">
                Track asset disposals and calculate CGT at 30% (2025 rate)
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Rate: {CGT_RATE}%
            </Badge>
          </div>

          {/* Warning Banner */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-semibold text-orange-900">New CGT Rate (2025)</p>
                  <p className="text-sm text-orange-800">
                    The CGT rate has increased to 30% under the Nigeria Tax Act 2025. 
                    New rules also apply to indirect transfers and corporate reorganizations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Gains</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalGain)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">CGT Payable</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalTax)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{events.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Add CGT Event Form */}
          {businessName && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Record Asset Disposal
                </CardTitle>
                <CardDescription>{businessName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetType">Asset Type *</Label>
                    <Select value={assetType} onValueChange={setAssetType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="real_estate">Real Estate</SelectItem>
                        <SelectItem value="shares">Shares/Securities</SelectItem>
                        <SelectItem value="business_assets">Business Assets</SelectItem>
                        <SelectItem value="intellectual_property">Intellectual Property</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proceeds">Sale Proceeds (₦) *</Label>
                    <Input
                      id="proceeds"
                      type="number"
                      value={proceeds}
                      onChange={(e) => setProceeds(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost">Acquisition Cost (₦) *</Label>
                    <Input
                      id="cost"
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reinvest">Reinvestment Amount (₦)</Label>
                    <Input
                      id="reinvest"
                      type="number"
                      value={reinvestAmount}
                      onChange={(e) => setReinvestAmount(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Rollover relief for qualifying reinvestments
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="exemptReason">Exemption Reason (if applicable)</Label>
                    <Input
                      id="exemptReason"
                      value={exemptReason}
                      onChange={(e) => setExemptReason(e.target.value)}
                      placeholder="E.g., Principal private residence"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="legalRef">Legal Reference / Notes</Label>
                    <Textarea
                      id="legalRef"
                      value={legalRef}
                      onChange={(e) => setLegalRef(e.target.value)}
                      placeholder="Additional details about the disposal"
                    />
                  </div>
                </div>

                {proceeds > 0 && cost > 0 && (
                  <Card className="bg-primary/5">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Calculated Gain:</span>
                          <span className="font-medium">{formatCurrency(calculateGain())}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">CGT Payable ({CGT_RATE}%):</span>
                          <span className="font-bold text-lg text-orange-600">
                            {formatCurrency(calculateTax())}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button onClick={handleAddEvent} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add CGT Event
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Events Table */}
          {events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>CGT Events History</CardTitle>
                <CardDescription>Track all asset disposals and gains</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Type</TableHead>
                      <TableHead className="text-right">Proceeds</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Gain</TableHead>
                      <TableHead className="text-right">CGT ({CGT_RATE}%)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="capitalize">
                          {event.asset_type.replace(/_/g, " ")}
                          {event.exempt_reason && (
                            <Badge variant="outline" className="ml-2 text-xs">Exempt</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(event.proceeds)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(event.cost)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(event.gain)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-orange-600">
                          {formatCurrency((event.gain * CGT_RATE) / 100)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => event.id && handleDeleteEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side Q&A Panel */}
        <div className="lg:w-96 lg:shrink-0">
          <div className="lg:sticky lg:top-6">
          <TaxQAPanel
            orgId={organization?.id || null}
            returnType="cit"
            onInsertNote={() => toast.success("Note saved")}
          />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
