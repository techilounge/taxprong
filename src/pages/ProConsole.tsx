import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePro } from "@/hooks/usePro";
import { useClients } from "@/hooks/useClients";
import { useEngagements } from "@/hooks/useEngagements";
import { useProInvoices } from "@/hooks/useProInvoices";
import { useMessages } from "@/hooks/useMessages";
import { EngagementWizard } from "@/components/pro/EngagementWizard";
import { ClientsList } from "@/components/pro/ClientsList";
import { AddClientDialog } from "@/components/pro/AddClientDialog";
import { EngagementsList } from "@/components/pro/EngagementsList";
import { WorkInProgressList } from "@/components/pro/WorkInProgressList";
import { InvoicesList } from "@/components/pro/InvoicesList";
import { CreateInvoiceDialog } from "@/components/pro/CreateInvoiceDialog";
import { MessagesList } from "@/components/pro/MessagesList";
import { supabase } from "@/integrations/supabase/client";

const ProConsole = () => {
  const { pro, isPro, loading } = usePro();
  const [engagementDialogOpen, setEngagementDialogOpen] = useState(false);
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [createInvoiceDialogOpen, setCreateInvoiceDialogOpen] = useState(false);
  
  const [session, setSession] = useState<any>(null);

  // Load session
  useState(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  });

  // Load data for each tab
  const clients = useClients(pro?.id || "");
  const engagements = useEngagements(pro?.id || "");
  const invoices = useProInvoices(pro?.id || "");
  const messages = useMessages(pro?.id || "", session?.user?.id || "");

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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Clients</CardTitle>
                  <CardDescription>Manage your client relationships</CardDescription>
                </div>
                <Button onClick={() => setAddClientDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </CardHeader>
              <CardContent>
                <ClientsList
                  clients={clients.clients}
                  loading={clients.loading}
                  onAddClient={() => setAddClientDialogOpen(true)}
                />
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
                <Dialog open={engagementDialogOpen} onOpenChange={setEngagementDialogOpen}>
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
                        onSuccess={() => {
                          setEngagementDialogOpen(false);
                          engagements.reload();
                        }}
                        onCancel={() => setEngagementDialogOpen(false)}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <EngagementsList
                  engagements={engagements.engagements}
                  loading={engagements.loading}
                  onNewEngagement={() => setEngagementDialogOpen(true)}
                />
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
                <WorkInProgressList
                  engagements={engagements.engagements}
                  loading={engagements.loading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Billing</CardTitle>
                  <CardDescription>Invoices and payments</CardDescription>
                </div>
                <Button onClick={() => setCreateInvoiceDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </CardHeader>
              <CardContent>
                <InvoicesList
                  invoices={invoices.invoices}
                  loading={invoices.loading}
                  stats={invoices.stats}
                  onCreateInvoice={() => setCreateInvoiceDialogOpen(true)}
                />
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
                <MessagesList
                  threads={messages.threads}
                  loading={messages.loading}
                  userId={session?.user?.id || ""}
                  onSendMessage={messages.sendMessage}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        {pro && (
          <>
            <AddClientDialog
              open={addClientDialogOpen}
              onOpenChange={setAddClientDialogOpen}
              proId={pro.id}
              onSuccess={clients.reload}
            />
            <CreateInvoiceDialog
              open={createInvoiceDialogOpen}
              onOpenChange={setCreateInvoiceDialogOpen}
              engagements={engagements.engagements}
              onSubmit={invoices.createInvoice}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProConsole;
