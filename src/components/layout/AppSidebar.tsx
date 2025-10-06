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
  Globe,
  Sparkles,
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
  { title: "Free Zones & EDI", url: "/free-zone", icon: Building2 },
  { title: "Non-Resident Tax", url: "/non-resident", icon: Globe },
  { title: "Industry Modules", url: "/industry", icon: Briefcase },
];

const proNavItems = [
  { title: "Marketplace", url: "/marketplace", icon: Building2 },
  { title: "Pro Console", url: "/pro-console", icon: UserCog },
  { title: "Client Portal", url: "/client-portal", icon: Presentation },
  { title: "Exceptions", url: "/exceptions", icon: AlertTriangle },
  { title: "Knowledge Base", url: "/knowledge", icon: BookOpen },
  { title: "Tax Q&A", url: "/tax-qa", icon: Search },
  { title: "AI Tax Advisor", url: "/ai-advisor", icon: Sparkles },
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
    <Sidebar collapsible="icon" className="bg-[#2d9cb7]">
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/90 font-semibold">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className="text-white hover:bg-white/10 hover:text-white data-[active=true]:bg-white/20 data-[active=true]:text-white"
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4 text-white/80" />
                        <span className="text-white">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tax Professional */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/90 font-semibold">Tax Professional</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {proNavItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className="text-white hover:bg-white/10 hover:text-white data-[active=true]:bg-white/20 data-[active=true]:text-white"
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4 text-white/80" />
                        <span className="text-white">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {isExpensesPage && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={handleOpenGuide}
                    className="text-white hover:bg-white/10 hover:text-white"
                  >
                    <HelpCircle className="h-4 w-4 text-white/80" />
                    <span className="text-white">Expenses Guide</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === '/admin'}
                    className="text-white hover:bg-white/10 hover:text-white data-[active=true]:bg-white/20 data-[active=true]:text-white"
                  >
                    <NavLink to="/admin">
                      <Shield className="h-4 w-4 text-white/80" />
                      <span className="text-white">Admin</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={location.pathname === '/settings'}
                  className="text-white hover:bg-white/10 hover:text-white data-[active=true]:bg-white/20 data-[active=true]:text-white"
                >
                  <NavLink to="/settings">
                    <Settings className="h-4 w-4 text-white/80" />
                    <span className="text-white">Settings</span>
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
