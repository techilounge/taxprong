import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DeleteRequestReview } from "@/components/admin/DeleteRequestReview";
import { SecurityMonitor } from "@/components/admin/SecurityMonitor";
import { SecurityAlerts } from "@/components/admin/SecurityAlerts";
import { ProfileAccessAudit } from "@/components/admin/ProfileAccessAudit";
import { MaintenanceMonitor } from "@/components/admin/MaintenanceMonitor";
import { UserRoleManagement } from "@/components/admin/UserRoleManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdmin } from "@/hooks/useAdmin";
import { Loader2 } from "lucide-react";

export default function Admin() {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">
            System administration, security monitoring, and data management
          </p>
        </div>

        <Tabs defaultValue="security" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="security">Security Monitor</TabsTrigger>
            <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
            <TabsTrigger value="audit">Profile Access</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="delete-requests">Delete Requests</TabsTrigger>
            <TabsTrigger value="roles">User Roles</TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-6">
            <SecurityMonitor />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <SecurityAlerts />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <ProfileAccessAudit />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <MaintenanceMonitor />
          </TabsContent>

          <TabsContent value="delete-requests" className="space-y-6">
            <DeleteRequestReview />
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <UserRoleManagement />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
