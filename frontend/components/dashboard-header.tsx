"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Search, Settings, LogOut, User, X, Leaf } from "lucide-react";
import { useRouter } from "next/navigation";
import { logout, getSession } from "@/lib/auth";

type UserInfo = {
  email?: string;
  sub?: string;
  "custom:Organisation"?: string;
  name?: string;
};

export function DashboardHeader() {
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    getSession().then((token) => {
      if (!token) return;
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserInfo(payload);
      } catch {
        /* ignore */
      }
    });
  }, []);

  function handleLogout() {
    logout(); // clears sessionStorage["idToken"] and signs out from Cognito
    router.push("/login");
  }

  const initials = userInfo?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <>
      <header className="border-b bg-background dark:bg-background sticky top-0 z-40 shadow-sm transition-smooth">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-md">
              <Leaf className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-foreground">SustainHub</h1>
          </div>

          {/* Search */}
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="relative w-96">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports, facilities, suppliers..."
                className="pl-10 transition-smooth focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/settings/organization")}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  {userInfo ? (
                    <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                      {initials}
                    </div>
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {userInfo?.email || "My Account"}
                    </span>
                    {userInfo?.["custom:Organisation"] && (
                      <span className="text-xs font-normal text-gray-500">
                        {userInfo["custom:Organisation"]}
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowProfile(true)}>
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/settings/organization")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Organization Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Profile modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 text-card-foreground border border-border animate-slide-in-up">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">View Profile</h2>
              <button 
                onClick={() => setShowProfile(false)}
                className="text-muted-foreground hover:text-foreground transition-smooth"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground text-xl font-bold flex items-center justify-center shadow-md">
                {initials}
              </div>
              <div>
                <p className="font-medium">{userInfo?.email || "—"}</p>
                <p className="text-sm text-muted-foreground">
                  {userInfo?.["custom:Organisation"] || "No organisation set"}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm border border-border rounded-lg p-4 bg-secondary/20">
              <div className="flex gap-2">
                <span className="font-medium w-28 text-muted-foreground">Email</span>
                <span className="text-foreground">{userInfo?.email || "—"}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium w-28 text-muted-foreground">
                  Organisation
                </span>
                <span className="text-foreground">{userInfo?.["custom:Organisation"] || "Not set"}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium w-28 text-muted-foreground">User ID</span>
                <span className="font-mono text-xs text-muted-foreground truncate">
                  {userInfo?.sub || "—"}
                </span>
              </div>
            </div>

            <div className="flex justify-between pt-2 gap-2">
              <Button
                variant="destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
              <Button variant="secondary" onClick={() => setShowProfile(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
