import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, FileText, DollarSign, FileCheck } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import { logAudit } from "@/lib/auditLog";

interface Exception {
  id: string;
  type: "missing_tin" | "large_vat" | "stampable_instrument";
  entity: string;
  entityId: string;
  description: string;
  amount?: number;
  createdAt: string;
}

export default function Exceptions() {
  const { toast } = useToast();
  const { organization, loading: orgLoading } = useOrganization();
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgLoading && organization) {
      loadExceptions();
    }
  }, [organization, orgLoading]);

  const loadExceptions = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      const foundExceptions: Exception[] = [];

      // Check for businesses without TIN
      const { data: businessesWithoutTIN } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('org_id', organization.id)
        .is('tin', null);

      businessesWithoutTIN?.forEach(biz => {
        foundExceptions.push({
          id: `tin_${biz.id}`,
          type: "missing_tin",
          entity: "business",
          entityId: biz.id,
          description: `Business "${biz.name}" is missing TIN number`,
          createdAt: new Date().toISOString()
        });
      });

      // Check for large VAT amounts (>100,000)
      const { data: largeVATExpenses } = await supabase
        .from('expenses')
        .select('id, merchant, vat_amount, date')
        .eq('org_id', organization.id)
        .gt('vat_amount', 100000);

      largeVATExpenses?.forEach(exp => {
        foundExceptions.push({
          id: `vat_${exp.id}`,
          type: "large_vat",
          entity: "expense",
          entityId: exp.id,
          description: `Large VAT amount (${exp.vat_amount?.toLocaleString()}) for ${exp.merchant}`,
          amount: exp.vat_amount || 0,
          createdAt: exp.date
        });
      });

      // Check for potential stampable instruments
      // Look for expenses with keywords like "lease", "agreement", "contract"
      const { data: potentialStampable } = await supabase
        .from('expenses')
        .select('id, merchant, description, amount, date')
        .eq('org_id', organization.id)
        .or('description.ilike.%lease%,description.ilike.%agreement%,description.ilike.%contract%')
        .gt('amount', 50000);

      potentialStampable?.forEach(exp => {
        foundExceptions.push({
          id: `stamp_${exp.id}`,
          type: "stampable_instrument",
          entity: "expense",
          entityId: exp.id,
          description: `Potential stampable document: ${exp.merchant} - ${exp.description}`,
          amount: exp.amount,
          createdAt: exp.date
        });
      });

      setExceptions(foundExceptions);
    } catch (error) {
      console.error('Error loading exceptions:', error);
      toast({
        title: "Error",
        description: "Failed to load exceptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (exception: Exception) => {
    if (!organization) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let taskTitle = "";
      let linkTo = "";

      switch (exception.type) {
        case "missing_tin":
          taskTitle = `Add TIN for ${exception.description.split('"')[1]}`;
          linkTo = "dashboard";
          break;
        case "large_vat":
          taskTitle = `Review large VAT: ${exception.description}`;
          linkTo = "expenses";
          break;
        case "stampable_instrument":
          taskTitle = `Review potential stampable document: ${exception.description.split(': ')[1]}`;
          linkTo = "expenses";
          break;
      }

      const { error } = await supabase.from('tasks').insert({
        org_id: organization.id,
        title: taskTitle,
        link_to: linkTo,
        status: 'open',
        auto_created: true,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      if (error) throw error;

      await logAudit('exception_task', exception.id, 'create', user.id, exception);

      toast({
        title: "Task created",
        description: "A task has been created for this exception",
      });

      // Remove from local state
      setExceptions(prev => prev.filter(e => e.id !== exception.id));
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const getIcon = (type: Exception['type']) => {
    switch (type) {
      case "missing_tin":
        return <FileText className="h-5 w-5 text-orange-500" />;
      case "large_vat":
        return <DollarSign className="h-5 w-5 text-red-500" />;
      case "stampable_instrument":
        return <FileCheck className="h-5 w-5 text-blue-500" />;
    }
  };

  if (orgLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading exceptions...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Exceptions</h1>
            <p className="text-muted-foreground">
              Review items that need attention
            </p>
          </div>
          <Button onClick={loadExceptions} variant="outline">
            Refresh
          </Button>
        </div>

        {exceptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No exceptions found</p>
              <p className="text-sm text-muted-foreground">
                Everything looks good!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {exceptions.map((exception) => (
              <Card key={exception.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getIcon(exception.type)}
                    <span className="capitalize">
                      {exception.type.replace(/_/g, ' ')}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>{exception.description}</p>
                    {exception.amount && (
                      <p className="text-sm text-muted-foreground">
                        Amount: ₦{exception.amount.toLocaleString()}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => createTask(exception)}
                        size="sm"
                      >
                        Create Task
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}