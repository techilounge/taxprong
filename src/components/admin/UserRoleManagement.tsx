import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignRoleDialog } from "./AssignRoleDialog";
import { RoleAssignmentsList } from "./RoleAssignmentsList";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Shield, Users, Eye } from "lucide-react";

export function UserRoleManagement() {
  const { roles, loading, assignRole, removeRole } = useUserRoles();

  const stats = {
    total: roles.length,
    admins: roles.filter((r) => r.role === "admin").length,
    moderators: roles.filter((r) => r.role === "moderator").length,
    users: roles.filter((r) => r.role === "user").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Role Management</h2>
          <p className="text-muted-foreground">
            Manage system-wide user roles and permissions
          </p>
        </div>
        <AssignRoleDialog onAssign={assignRole} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.moderators}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Assignments</CardTitle>
          <CardDescription>
            View and manage all user role assignments in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoleAssignmentsList
            roles={roles}
            onRemove={removeRole}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
