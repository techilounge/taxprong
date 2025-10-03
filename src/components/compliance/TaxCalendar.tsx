import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, addDays, isBefore, isAfter, startOfDay } from "date-fns";

interface Deadline {
  id: string;
  title: string;
  date: Date;
  type: "vat" | "pit" | "cit" | "wht" | "stamp" | "returns" | "other";
  description: string;
  priority: "high" | "medium" | "low";
  recurrence?: "monthly" | "quarterly" | "annual";
}

export function TaxCalendar() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  useEffect(() => {
    generateDeadlines();
  }, []);

  const generateDeadlines = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    const deadlineList: Deadline[] = [
      // VAT Returns (Monthly - 15th of following month)
      {
        id: "vat-jan",
        title: "VAT Return - January",
        date: new Date(currentYear, 1, 15),
        type: "vat",
        description: "Submit January VAT return and payment",
        priority: "high",
        recurrence: "monthly",
      },
      {
        id: "vat-feb",
        title: "VAT Return - February",
        date: new Date(currentYear, 2, 15),
        type: "vat",
        description: "Submit February VAT return and payment",
        priority: "high",
        recurrence: "monthly",
      },
      {
        id: "vat-mar",
        title: "VAT Return - March",
        date: new Date(currentYear, 3, 15),
        type: "vat",
        description: "Submit March VAT return and payment",
        priority: "high",
        recurrence: "monthly",
      },
      
      // Withholding Tax (Monthly - 10th of following month)
      {
        id: "wht-monthly",
        title: "WHT Remittance",
        date: new Date(currentYear, today.getMonth() + 1, 10),
        type: "wht",
        description: "Remit withholding tax deducted during the month",
        priority: "high",
        recurrence: "monthly",
      },

      // CIT Returns (Annual - 6 months after year-end)
      {
        id: "cit-return",
        title: "CIT Return Filing",
        date: new Date(currentYear, 5, 30),
        type: "cit",
        description: "File annual CIT return (for companies with Dec 31 year-end)",
        priority: "high",
        recurrence: "annual",
      },

      // Development Levy (Quarterly)
      {
        id: "dev-levy-q1",
        title: "Development Levy - Q1",
        date: new Date(currentYear, 3, 30),
        type: "cit",
        description: "Pay Q1 Development Levy (4% of assessable profits)",
        priority: "high",
        recurrence: "quarterly",
      },

      // PIT Returns (Annual - March 31)
      {
        id: "pit-return",
        title: "PIT Return Filing",
        date: new Date(currentYear, 2, 31),
        type: "pit",
        description: "File annual Personal Income Tax return",
        priority: "high",
        recurrence: "annual",
      },

      // E-Invoice Compliance
      {
        id: "einvoice-registration",
        title: "E-Invoice System Registration",
        date: new Date(2026, 0, 1),
        type: "other",
        description: "Register with e-invoicing system (mandatory from Jan 2026)",
        priority: "high",
      },

      // Stamp Duty
      {
        id: "stamp-duty-monthly",
        title: "Stamp Duty Returns",
        date: new Date(currentYear, today.getMonth() + 1, 15),
        type: "stamp",
        description: "File monthly stamp duty returns for instruments executed",
        priority: "medium",
        recurrence: "monthly",
      },

      // ETR Compliance (for MNEs)
      {
        id: "etr-filing",
        title: "ETR Information Return",
        date: new Date(currentYear, 11, 31),
        type: "returns",
        description: "File Effective Tax Rate information return (MNEs only)",
        priority: "high",
        recurrence: "annual",
      },

      // Transfer Pricing Documentation
      {
        id: "tp-docs",
        title: "Transfer Pricing Documentation",
        date: new Date(currentYear, 5, 30),
        type: "returns",
        description: "Prepare and maintain transfer pricing documentation",
        priority: "medium",
        recurrence: "annual",
      },
    ];

    setDeadlines(deadlineList.filter(d => isAfter(d.date, addDays(today, -30))));
  };

  const getStatusColor = (deadline: Deadline) => {
    const today = startOfDay(new Date());
    const deadlineDate = startOfDay(deadline.date);
    const daysUntil = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (isBefore(deadlineDate, today)) {
      return "destructive";
    } else if (daysUntil <= 7) {
      return "destructive";
    } else if (daysUntil <= 30) {
      return "secondary";
    }
    return "outline";
  };

  const getStatusText = (deadline: Deadline) => {
    const today = startOfDay(new Date());
    const deadlineDate = startOfDay(deadline.date);
    const daysUntil = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (isBefore(deadlineDate, today)) {
      return "Overdue";
    } else if (daysUntil === 0) {
      return "Due Today";
    } else if (daysUntil <= 7) {
      return `${daysUntil} days`;
    } else if (daysUntil <= 30) {
      return `${daysUntil} days`;
    }
    return format(deadlineDate, "MMM d, yyyy");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "vat":
        return "💰";
      case "pit":
        return "👤";
      case "cit":
        return "🏢";
      case "wht":
        return "📊";
      case "stamp":
        return "📜";
      case "returns":
        return "📋";
      default:
        return "📅";
    }
  };

  const filteredDeadlines = selectedFilter === "all"
    ? deadlines
    : deadlines.filter(d => d.type === selectedFilter);

  const upcomingDeadlines = filteredDeadlines
    .filter(d => !isBefore(startOfDay(d.date), startOfDay(new Date())))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const overdueDeadlines = filteredDeadlines
    .filter(d => isBefore(startOfDay(d.date), startOfDay(new Date())))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Tax Compliance Calendar 2026
        </CardTitle>
        <CardDescription>
          Key deadlines under the Nigeria Tax Act 2025
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {["all", "vat", "pit", "cit", "wht", "stamp", "returns"].map((filter) => (
            <Badge
              key={filter}
              variant={selectedFilter === filter ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedFilter(filter)}
            >
              {filter.toUpperCase()}
            </Badge>
          ))}
        </div>

        {/* Overdue Section */}
        {overdueDeadlines.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <h3 className="font-semibold">Overdue ({overdueDeadlines.length})</h3>
            </div>
            {overdueDeadlines.map((deadline) => (
              <Card key={deadline.id} className="border-destructive bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getTypeIcon(deadline.type)}</span>
                        <h4 className="font-medium">{deadline.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{deadline.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusColor(deadline)}>
                        {getStatusText(deadline)}
                      </Badge>
                      {deadline.priority === "high" && (
                        <Badge variant="destructive" className="ml-1 text-xs">
                          High
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Upcoming Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Upcoming Deadlines</h3>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming deadlines in the selected category</p>
          ) : (
            upcomingDeadlines.map((deadline) => (
              <Card key={deadline.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getTypeIcon(deadline.type)}</span>
                        <h4 className="font-medium">{deadline.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{deadline.description}</p>
                      {deadline.recurrence && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {deadline.recurrence}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusColor(deadline)}>
                        {getStatusText(deadline)}
                      </Badge>
                      {deadline.priority === "high" && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          High
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Key Notes */}
        <Card className="bg-primary/5">
          <CardContent className="pt-4">
            <h4 className="font-semibold mb-2">Key Changes in 2025/2026</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• E-invoicing mandatory from January 2026</li>
              <li>• Development Levy (4%) now quarterly</li>
              <li>• ETR information return for MNEs (15% threshold)</li>
              <li>• Increased penalties for late filing/payment</li>
              <li>• New CGT rate of 30%</li>
            </ul>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
