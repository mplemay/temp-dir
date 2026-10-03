import { Link, useRouterState } from "@tanstack/react-router";
import { FlaskConical, House, MapPinned, NotebookPen } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Home", to: "/", icon: House },
  { title: "Market Intelligence", to: "/market-intelligence", icon: MapPinned },
  { title: "Product Knowledge", to: "/product-knowledge", icon: FlaskConical },
  { title: "CRM", to: "/crm", icon: NotebookPen },
] as const;

export function isSidebarItemActive(pathname: string, to: string): boolean {
  if (to === "/") {
    return pathname === "/";
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-4 py-3 text-sm font-medium">Sales Copilot</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    render={<Link to={item.to} />}
                    isActive={isSidebarItemActive(pathname, item.to)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
