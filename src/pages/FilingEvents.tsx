import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { format } from "date-fns";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface FilingEvent {
  id: string;
  filing_type: string;
  period: string;
  due_date: string;
  filed_at: string | null;
}

export default function FilingEvents() {
  const [events, setEvents] = useState<FilingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { organization } = useOrganization();

  useEffect(() => {
    if (organization) {
      loadEvents();
    }
  }, [organization]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data, error } = await supabase
        .from("filing_events")
        .select("*")
        .eq("org_id", organization?.id)
        .gte("due_date", twelveMonthsAgo.toISOString().split('T')[0])
        .order("due_date", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error loading filing events:", error);
    } finally {
      setLoading(false);
    }
  };

  const isOnTime = (event: FilingEvent) => {
    if (!event.filed_at) return null;
    return new Date(event.filed_at) <= new Date(event.due_date);
  };

  const getStatusBadge = (event: FilingEvent) => {
    const onTime = isOnTime(event);
    
    if (onTime === null) {
      return <Badge variant="outline">Not Filed</Badge>;
    }
    
    if (onTime) {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          On Time
        </Badge>
      );
    }
    
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Late
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Filing Events</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track filing compliance over the last 12 months
          </p>
        </div>

        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Filing History</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Filing events with on-time/late status indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No filing events found for the last 12 months
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Filing Type</TableHead>
                      <TableHead className="hidden sm:table-cell">Period</TableHead>
                      <TableHead className="text-xs sm:text-sm">Due Date</TableHead>
                      <TableHead className="hidden md:table-cell">Filed Date</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium capitalize text-xs sm:text-sm">
                          {event.filing_type.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{event.period}</TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                          {format(new Date(event.due_date), "MMM dd")}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                          {event.filed_at 
                            ? format(new Date(event.filed_at), "MMM dd")
                            : "-"
                          }
                        </TableCell>
                        <TableCell>{getStatusBadge(event)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
