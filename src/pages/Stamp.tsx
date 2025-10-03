import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { Plus, FileText, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Business {
  id: string;
  name: string;
}

interface StampInstrument {
  id: string;
  business_id: string;
  type: string;
  exec_date: string;
  deadline: string | null;
  duty_due: number | null;
  liable_party: string | null;
  stamped: boolean;
  attachment: string | null;
  businesses: Business;
}

export default function Stamp() {
  const [instruments, setInstruments] = useState<StampInstrument[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { organization, loading: orgLoading } = useOrganization();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    business_id: "",
    type: "",
    exec_date: "",
    duty_due: "",
    liable_party: "",
  });

  useEffect(() => {
    if (organization) {
      loadData();
    }
  }, [organization]);

  const loadData = async () => {
    if (!organization) return;
    
    try {
      setLoading(true);

      // Load businesses
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("org_id", organization.id)
        .is("deleted_at", null);

      if (businessError) throw businessError;
      setBusinesses(businessData || []);

      // Load stamp instruments
      const { data: instrumentsData, error: instrumentsError } = await supabase
        .from("stamp_instruments")
        .select(`
          *,
          businesses:business_id (
            id,
            name
          )
        `)
        .in("business_id", (businessData || []).map(b => b.id))
        .order("exec_date", { ascending: false });

      if (instrumentsError) throw instrumentsError;
      setInstruments(instrumentsData || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load stamp duty instruments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organization) return;

    try {
      const { error } = await supabase.from("stamp_instruments").insert({
        business_id: formData.business_id,
        type: formData.type,
        exec_date: formData.exec_date,
        duty_due: formData.duty_due ? parseFloat(formData.duty_due) : null,
        liable_party: formData.liable_party,
        stamped: false,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stamp instrument created successfully",
      });

      setDialogOpen(false);
      setFormData({
        business_id: "",
        type: "",
        exec_date: "",
        duty_due: "",
        liable_party: "",
      });
      loadData();
    } catch (error: any) {
      console.error("Error creating instrument:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create stamp instrument",
        variant: "destructive",
      });
    }
  };

  const markAsStamped = async (id: string) => {
    try {
      const { error } = await supabase
        .from("stamp_instruments")
        .update({ stamped: true })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Instrument marked as stamped",
      });

      loadData();
    } catch (error: any) {
      console.error("Error updating instrument:", error);
      toast({
        title: "Error",
        description: "Failed to update instrument",
        variant: "destructive",
      });
    }
  };

  if (orgLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading stamp duty instruments...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!organization) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No organization found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stamp Duty</h1>
            <p className="text-muted-foreground mt-1">
              Manage stampable instruments and track filing deadlines
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Instrument
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add Stamp Instrument</DialogTitle>
                  <DialogDescription>
                    Record a new stampable instrument for tracking
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="business">Business</Label>
                    <Select
                      value={formData.business_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, business_id: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business" />
                      </SelectTrigger>
                      <SelectContent>
                        {businesses.map((business) => (
                          <SelectItem key={business.id} value={business.id}>
                            {business.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Instrument Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lease">Lease Agreement</SelectItem>
                        <SelectItem value="conveyance">Conveyance</SelectItem>
                        <SelectItem value="mortgage">Mortgage</SelectItem>
                        <SelectItem value="share_transfer">Share Transfer</SelectItem>
                        <SelectItem value="loan_agreement">Loan Agreement</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="exec_date">Execution Date</Label>
                    <Input
                      id="exec_date"
                      type="date"
                      value={formData.exec_date}
                      onChange={(e) =>
                        setFormData({ ...formData, exec_date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="duty_due">Duty Due (TZS)</Label>
                    <Input
                      id="duty_due"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.duty_due}
                      onChange={(e) =>
                        setFormData({ ...formData, duty_due: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="liable_party">Liable Party</Label>
                    <Input
                      id="liable_party"
                      placeholder="Enter liable party name"
                      value={formData.liable_party}
                      onChange={(e) =>
                        setFormData({ ...formData, liable_party: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Instrument</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stamp Instruments</CardTitle>
            <CardDescription>
              Track stampable documents and their filing deadlines (30 days from execution)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {instruments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No instruments found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your first stampable instrument to start tracking
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Execution Date</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Duty Due</TableHead>
                    <TableHead>Liable Party</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instruments.map((instrument) => {
                    const isOverdue = instrument.deadline && 
                      new Date(instrument.deadline) < new Date() && 
                      !instrument.stamped;
                    
                    return (
                      <TableRow key={instrument.id}>
                        <TableCell className="font-medium">
                          {instrument.businesses.name}
                        </TableCell>
                        <TableCell className="capitalize">
                          {instrument.type.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(instrument.exec_date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          {instrument.deadline ? (
                            <div className="flex items-center gap-2">
                              {isOverdue && (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              )}
                              <span className={isOverdue ? "text-destructive" : ""}>
                                {format(new Date(instrument.deadline), "dd MMM yyyy")}
                              </span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {instrument.duty_due
                            ? `TZS ${instrument.duty_due.toLocaleString()}`
                            : "-"}
                        </TableCell>
                        <TableCell>{instrument.liable_party || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={instrument.stamped ? "default" : "secondary"}>
                            {instrument.stamped ? "Stamped" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!instrument.stamped && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsStamped(instrument.id)}
                            >
                              Mark as Stamped
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
