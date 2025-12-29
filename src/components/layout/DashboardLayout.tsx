import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConsentBanner } from "@/components/privacy/ConsentBanner";
import { PrivacyModal } from "@/components/privacy/PrivacyModal";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("");
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        // Get user profile
        supabase
          .from("profiles")
          .select("name, email")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setUserName(data.name || data.email);
            }
          });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error("Failed to sign out");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex flex-col flex-1">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger />
              
              <div className="flex-1" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(userName || "U")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{userName}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <User className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
            {children}
          </main>

          {/* Footer - hidden on mobile */}
          <footer className="hidden md:block border-t bg-background py-4 px-6">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 text-sm text-muted-foreground">
              <p className="text-center sm:text-left">© 2025 Nigeria Tax Platform. All rights reserved.</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => setPrivacyModalOpen(true)}
                  className="hover:text-foreground transition-colors hover:underline"
                >
                  Privacy & NDPA
                </button>
                <a href="#" className="hover:text-foreground transition-colors hover:underline">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-foreground transition-colors hover:underline">
                  Contact Support
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Privacy Modal */}
      <PrivacyModal open={privacyModalOpen} onOpenChange={setPrivacyModalOpen} />

      {/* Consent Banner */}
      <ConsentBanner />
    </SidebarProvider>
  );
}
