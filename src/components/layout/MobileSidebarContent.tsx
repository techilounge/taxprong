import { NavLink, useLocation } from "react-router-dom";
import { Settings, Shield, HelpCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdmin } from "@/hooks/useAdmin";
import { mainNavItems, proNavItems } from "./AppSidebar";

export function MobileSidebarContent() {
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const isExpensesPage = location.pathname === '/expenses';

  const handleOpenGuide = () => {
    window.dispatchEvent(new CustomEvent('open-expense-guide'));
  };

  const linkClasses = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-md text-white transition-colors ${
      isActive ? 'bg-white/20' : 'hover:bg-white/10'
    }`;

  return (
    <ScrollArea className="h-full bg-[#2d9cb7]">
      <div className="flex flex-col p-4 gap-6">
        {/* Main Navigation */}
        <div>
          <p className="text-white/70 font-semibold text-xs uppercase tracking-wider mb-2 px-3">
            Main
          </p>
          <nav className="flex flex-col gap-1">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className={({ isActive }) => linkClasses(isActive)}
              >
                <item.icon className="h-4 w-4 text-white/80" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Tax Professional */}
        <div>
          <p className="text-white/70 font-semibold text-xs uppercase tracking-wider mb-2 px-3">
            Tax Professional
          </p>
          <nav className="flex flex-col gap-1">
            {proNavItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className={({ isActive }) => linkClasses(isActive)}
              >
                <item.icon className="h-4 w-4 text-white/80" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Settings */}
        <div>
          <nav className="flex flex-col gap-1">
            {isExpensesPage && (
              <button
                onClick={handleOpenGuide}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-white hover:bg-white/10 transition-colors w-full text-left"
              >
                <HelpCircle className="h-4 w-4 text-white/80" />
                <span>Expenses Guide</span>
              </button>
            )}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => linkClasses(isActive)}
              >
                <Shield className="h-4 w-4 text-white/80" />
                <span>Admin</span>
              </NavLink>
            )}
            <NavLink
              to="/settings"
              className={({ isActive }) => linkClasses(isActive)}
            >
              <Settings className="h-4 w-4 text-white/80" />
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>
      </div>
    </ScrollArea>
  );
}
