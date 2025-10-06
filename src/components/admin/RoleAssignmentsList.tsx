import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RoleBadge } from "./RoleBadge";
import { Search, Trash2 } from "lucide-react";
import type { UserRoleAssignment } from "@/hooks/useUserRoles";

interface RoleAssignmentsListProps {
  roles: UserRoleAssignment[];
  onRemove: (email: string, role: string) => Promise<boolean>;
  loading: boolean;
}

export function RoleAssignmentsList({
  roles,
  onRemove,
  loading,
}: RoleAssignmentsListProps) {
  const [search, setSearch] = useState("");
  const [removeTarget, setRemoveTarget] = useState<{
    email: string;
    role: string;
  } | null>(null);
  const [removing, setRemoving] = useState(false);

  const filteredRoles = roles.filter(
    (r) =>
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleRemove = async () => {
    if (!removeTarget) return;

    setRemoving(true);
    await onRemove(removeTarget.email, removeTarget.role);
    setRemoving(false);
    setRemoveTarget(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse">Loading role assignments...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {search ? "No matching role assignments found" : "No role assignments yet"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.name || "Unknown"}
                    </TableCell>
                    <TableCell>{assignment.email}</TableCell>
                    <TableCell>
                      <RoleBadge role={assignment.role} />
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.user_created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setRemoveTarget({
                            email: assignment.email,
                            role: assignment.role,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog
        open={!!removeTarget}
        onOpenChange={() => setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the <strong>{removeTarget?.role}</strong> role
              from <strong>{removeTarget?.email}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? "Removing..." : "Remove Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
