import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePro } from "@/hooks/usePro";
import { EngagementWizard } from "@/components/pro/EngagementWizard";

const ProConsole = () => {
  const { pro, isPro, loading } = usePro();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isPro) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need to be registered as a Tax Professional to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tax Pro Console</h1>
            <p className="text-muted-foreground">Manage clients, engagements, and billing</p>
          </div>
        </div>

        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="engagements">Engagements</TabsTrigger>
            <TabsTrigger value="work">Work in Progress</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Clients</CardTitle>
                <CardDescription>Manage your client relationships</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Client list coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagements">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Engagements</CardTitle>
                  <CardDescription>Active and pending client engagements</CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Engagement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Engagement</DialogTitle>
                      <DialogDescription>
                        Set up a new client engagement with scope and deliverables
                      </DialogDescription>
                    </DialogHeader>
                    {pro && (
                      <EngagementWizard
                        proId={pro.id}
                        onSuccess={() => setDialogOpen(false)}
                        onCancel={() => setDialogOpen(false)}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Engagement list coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="work">
            <Card>
              <CardHeader>
                <CardTitle>Work in Progress</CardTitle>
                <CardDescription>Track ongoing client work</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Work tracking coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing</CardTitle>
                <CardDescription>Invoices and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Billing dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>Client communications</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Messaging interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProConsole;
