import { Badge } from "@/components/ui/badge";
import { Shield, Users, Eye } from "lucide-react";

interface RoleBadgeProps {
  role: string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const getRoleConfig = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return {
          icon: Shield,
          variant: "destructive" as const,
          label: "Admin",
        };
      case "moderator":
        return {
          icon: Users,
          variant: "default" as const,
          label: "Moderator",
        };
      case "user":
        return {
          icon: Eye,
          variant: "secondary" as const,
          label: "User",
        };
      default:
        return {
          icon: Eye,
          variant: "outline" as const,
          label: role,
        };
    }
  };

  const config = getRoleConfig(role);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
