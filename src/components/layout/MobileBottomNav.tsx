import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Receipt, FileText, Shield, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileSidebarContent } from "./MobileSidebarContent";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Receipt, label: "Expenses", path: "/expenses" },
  { icon: FileText, label: "VAT", path: "/vat" },
  { icon: Shield, label: "Compliance", path: "/compliance" },
];

export function MobileBottomNav() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isMobile) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              isActive(item.path)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
        
        {/* More menu - opens sidebar sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
              <span className="text-xs font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <MobileSidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
