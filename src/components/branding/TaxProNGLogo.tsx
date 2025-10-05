import { cn } from "@/lib/utils";

interface TaxProNGLogoProps {
  size?: "sm" | "default" | "lg";
  variant?: "full" | "icon";
  className?: string;
}

export const TaxProNGLogo = ({ 
  size = "default", 
  variant = "full",
  className 
}: TaxProNGLogoProps) => {
  const sizes = {
    sm: {
      container: "h-8",
      text: "text-lg",
      icon: "w-6 h-6",
    },
    default: {
      container: "h-10",
      text: "text-2xl",
      icon: "w-8 h-8",
    },
    lg: {
      container: "h-12",
      text: "text-3xl",
      icon: "w-10 h-10",
    },
  };

  const currentSize = sizes[size];

  // Icon-only version (TP monogram)
  if (variant === "icon") {
    return (
      <div 
        className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-primary text-white font-bold",
          currentSize.icon,
          className
        )}
      >
        <span className={cn("leading-none", size === "sm" ? "text-xs" : size === "lg" ? "text-xl" : "text-base")}>
          TP
        </span>
      </div>
    );
  }

  // Full logo with text
  return (
    <div className={cn("flex items-center gap-2", currentSize.container, className)}>
      {/* Icon */}
      <div 
        className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-primary text-white font-bold flex-shrink-0",
          currentSize.icon
        )}
      >
        <span className={cn("leading-none", size === "sm" ? "text-xs" : size === "lg" ? "text-xl" : "text-base")}>
          TP
        </span>
      </div>
      
      {/* Text */}
      <div className="flex flex-col leading-tight">
        <span className={cn("font-bold text-primary", currentSize.text)}>
          TaxPro<span className="text-secondary">NG</span>
        </span>
      </div>
    </div>
  );
};
