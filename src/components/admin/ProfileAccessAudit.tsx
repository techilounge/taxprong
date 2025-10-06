import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, AlertTriangle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAdmin } from "@/hooks/useAdmin";

interface ProfileAccessPattern {
  user_id: string;
  profile_queries_count: number;
  unique_profiles_accessed: number;
  last_access: string;
  risk_level: string;
}

export function ProfileAccessAudit() {
  const { isAdmin } = useAdmin();
  const [patterns, setPatterns] = useState<ProfileAccessPattern[]>([]);
  const [loading, setLoading] = useState(false);

  const auditProfileAccess = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("audit_profile_access_pattern");
      
      if (error) throw error;
      
      setPatterns(data || []);
      
      const highRiskCount = data?.filter((p: ProfileAccessPattern) => p.risk_level === 'high').length || 0;
      if (highRiskCount > 0) {
        toast.warning(`Found ${highRiskCount} high-risk profile access pattern(s)`);
      } else {
        toast.success("No suspicious profile access patterns detected");
      }
    } catch (error: any) {
      console.error("Error auditing profile access:", error);
      toast.error("Failed to audit profile access patterns");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You must be an administrator to view profile access audits.
        </AlertDescription>
      </Alert>
    );
  }

  const getRiskBadge = (risk: string) => {
    const variants: Record<string, any> = {
      high: "destructive",
      medium: "default",
      low: "secondary",
    };
    return variants[risk] || "outline";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Access Audit
            </CardTitle>
            <CardDescription>
              Monitor profile query patterns to detect enumeration attacks
            </CardDescription>
          </div>
          <Button onClick={auditProfileAccess} disabled={loading} variant="outline">
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Scanning..." : "Audit Access"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {patterns.length > 0 ? (
          <div className="space-y-4">
            {patterns.some(p => p.risk_level === 'high') && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>High-Risk Activity Detected</AlertTitle>
                <AlertDescription>
                  Some users have accessed an unusually high number of profiles in the last 24 hours.
                  This could indicate profile enumeration attacks.
                </AlertDescription>
              </Alert>
            )}
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Total Queries</TableHead>
                  <TableHead>Unique Profiles</TableHead>
                  <TableHead>Last Access</TableHead>
                  <TableHead>Risk Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patterns.map((pattern) => (
                  <TableRow key={pattern.user_id}>
                    <TableCell className="font-mono text-xs">
                      {pattern.user_id}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {pattern.profile_queries_count}
                    </TableCell>
                    <TableCell>
                      {pattern.unique_profiles_accessed}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(pattern.last_access), "PPp")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRiskBadge(pattern.risk_level)}>
                        {pattern.risk_level}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {loading ? "Scanning profile access patterns..." : "No unusual profile access detected. Click 'Audit Access' to scan."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
