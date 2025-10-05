import { Shield, CheckCircle2, Award, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
  variant: "firs" | "security" | "iso" | "data-protection";
  className?: string;
}

const badgeConfig = {
  firs: {
    icon: CheckCircle2,
    label: "FIRS Approved",
    color: "text-green-600",
  },
  security: {
    icon: Lock,
    label: "Bank-Level Encryption",
    color: "text-blue-600",
  },
  iso: {
    icon: Award,
    label: "ISO Certified",
    color: "text-purple-600",
  },
  "data-protection": {
    icon: Shield,
    label: "Data Protection Certified",
    color: "text-orange-600",
  },
};

export const TrustBadge = ({ variant, className }: TrustBadgeProps) => {
  const config = badgeConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border",
        className
      )}
    >
      <Icon className={cn("h-5 w-5", config.color)} />
      <span className="text-sm font-medium text-foreground">{config.label}</span>
    </div>
  );
};
