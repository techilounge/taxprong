import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Users,
  Briefcase,
  Settings,
  Calculator,
  Stamp,
  DollarSign,
  FileBarChart,
  Building2,
  UserCog,
  Presentation,
  AlertTriangle,
  BookOpen,
  Search,
  Shield,
  BarChart3,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAdmin } from "@/hooks/useAdmin";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Expenses", url: "/expenses", icon: Receipt },
  { title: "VAT Console", url: "/vat", icon: FileText },
  { title: "PIT & PAYE", url: "/pit", icon: Calculator },
  { title: "CIT & Levy", url: "/cit", icon: DollarSign },
  { title: "CGT", url: "/cgt", icon: TrendingUp },
  { title: "Stamp Duty", url: "/stamp", icon: Stamp },
  { title: "Compliance", url: "/compliance", icon: Shield },
];

const proNavItems = [
  { title: "Marketplace", url: "/marketplace", icon: Building2 },
  { title: "Pro Console", url: "/pro-console", icon: UserCog },
  { title: "Client Portal", url: "/client-portal", icon: Presentation },
  { title: "Exceptions", url: "/exceptions", icon: AlertTriangle },
  { title: "Knowledge Base", url: "/knowledge", icon: BookOpen },
  { title: "Tax Q&A", url: "/tax-qa", icon: Search },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const isExpensesPage = location.pathname === '/expenses';

  const handleOpenGuide = () => {
    window.dispatchEvent(new CustomEvent('open-expense-guide'));
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tax Professional */}
        <SidebarGroup>
          <SidebarGroupLabel>Tax Professional</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {proNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {isExpensesPage && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleOpenGuide}>
                    <HelpCircle className="h-4 w-4" />
                    <span>Expenses Guide</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/admin"
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "hover:bg-sidebar-accent/50"
                    }
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
