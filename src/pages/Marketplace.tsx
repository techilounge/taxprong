import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Star, Briefcase, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Pro {
  id: string;
  user_id: string;
  practice_name: string;
  bio: string;
  hourly_rate: number;
  services: string[];
  badges: string[];
  avg_rating: number;
  review_count: number;
  kyc_status: string;
}

export default function Marketplace() {
  const [pros, setPros] = useState<Pro[]>([]);
  const [filteredPros, setFilteredPros] = useState<Pro[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPro, setSelectedPro] = useState<Pro | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [scope, setScope] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadPros();
  }, []);

  useEffect(() => {
    filterPros();
  }, [searchQuery, pros]);

  const loadPros = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pros")
        .select("*")
        .eq("kyc_status", "verified")
        .order("avg_rating", { ascending: false });

      if (error) throw error;
      setPros(data || []);
    } catch (error: any) {
      console.error("Error loading pros:", error);
      toast({
        title: "Error",
        description: "Failed to load professionals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPros = () => {
    if (!searchQuery.trim()) {
      setFilteredPros(pros);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = pros.filter(
      (pro) =>
        pro.practice_name?.toLowerCase().includes(query) ||
        pro.bio?.toLowerCase().includes(query) ||
        pro.services?.some((s) => s.toLowerCase().includes(query)) ||
        pro.badges?.some((b) => b.toLowerCase().includes(query))
    );
    setFilteredPros(filtered);
  };

  const handleBookRequest = (pro: Pro) => {
    setSelectedPro(pro);
    setBookingDialogOpen(true);
  };

  const submitBookingRequest = async () => {
    if (!selectedPro || !scope.trim()) {
      toast({
        title: "Error",
        description: "Please provide engagement scope",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to request an engagement",
          variant: "destructive",
        });
        return;
      }

      // Get user's organization
      const { data: orgUser } = await supabase
        .from("org_users")
        .select("org_id")
        .eq("user_id", session.user.id)
        .single();

      if (!orgUser) {
        toast({
          title: "Setup required",
          description: "Please complete your profile setup",
          variant: "destructive",
        });
        return;
      }

      // Create client record if doesn't exist
      let { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("person_user_id", session.user.id)
        .eq("created_by_pro", selectedPro.id)
        .maybeSingle();

      if (!client) {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            person_user_id: session.user.id,
            org_id: orgUser.org_id,
            created_by_pro: selectedPro.id,
            status: "active",
          })
          .select()
          .single();

        if (clientError) throw clientError;
        client = newClient;
      }

      // Create engagement request
      const { error: engagementError } = await supabase
        .from("engagements")
        .insert({
          pro_id: selectedPro.id,
          client_id: client.id,
          scope: scope,
          escrow_status: "unfunded",
        });

      if (engagementError) throw engagementError;

      toast({
        title: "Success",
        description: "Engagement request sent to professional",
      });

      setBookingDialogOpen(false);
      setScope("");
      setSelectedPro(null);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: "Failed to create engagement request",
        variant: "destructive",
      });
    }
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
        <div>
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">
            Find verified tax professionals for your business
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, service, or expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading professionals...</p>
          </div>
        ) : filteredPros.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">
                {searchQuery ? "No professionals found matching your search" : "No professionals available"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPros.map((pro) => (
              <Card key={pro.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {pro.practice_name?.substring(0, 2).toUpperCase() || "PR"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{pro.practice_name}</CardTitle>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {pro.avg_rating > 0 ? pro.avg_rating.toFixed(1) : "New"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({pro.review_count} {pro.review_count === 1 ? "review" : "reviews"})
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-3">
                    {pro.bio || "Experienced tax professional"}
                  </CardDescription>

                  {pro.badges && pro.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {pro.badges.map((badge, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {pro.services && pro.services.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {pro.services.slice(0, 3).map((service, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {service}
                        </Badge>
                      ))}
                      {pro.services.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{pro.services.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatCurrency(pro.hourly_rate || 0)}/hr
                      </span>
                    </div>
                    <Button onClick={() => handleBookRequest(pro)} size="sm">
                      Request Engagement
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Engagement</DialogTitle>
              <DialogDescription>
                Describe your tax service needs for {selectedPro?.practice_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="scope">Engagement Scope</Label>
                <Textarea
                  id="scope"
                  placeholder="Describe what services you need (e.g., VAT return filing, CIT advisory, etc.)"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBookingDialogOpen(false);
                    setScope("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={submitBookingRequest}>Send Request</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
