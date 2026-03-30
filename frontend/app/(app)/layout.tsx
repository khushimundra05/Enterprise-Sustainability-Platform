import React from "react";
import AuthGuard from "@/components/AuthGuard";
import { DashboardHeader } from "@/components/dashboard-header";
import { SidebarNav } from "@/components/sidebar-nav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div className="flex flex-col h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex flex-1 overflow-hidden">
          <SidebarNav />
          <main className="flex-1 overflow-y-auto">
            <div className="p-8">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
