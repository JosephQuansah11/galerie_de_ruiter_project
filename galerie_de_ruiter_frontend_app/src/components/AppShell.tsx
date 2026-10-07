import type { ReactNode } from "react";
import { SidebarNavigation } from "./SidebarNavigation";
import { AppTopbar } from "./AppTopbar";

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="app-shell">
    <SidebarNavigation />
    <main className="main-content"><AppTopbar />{children}</main>
  </div>;
}
