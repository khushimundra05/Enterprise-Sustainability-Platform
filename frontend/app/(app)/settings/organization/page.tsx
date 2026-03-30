"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";

type DecodedToken = {
  email?: string;
  sub?: string;
  "custom:Organisation"?: string;
  name?: string;
};

export default function OrganizationSettingsPage() {
  const [user, setUser] = useState<DecodedToken | null>(null);

  useEffect(() => {
    getSession().then((token) => {
      if (!token) return;
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser(payload);
      } catch {
        // ignore decode errors
      }
    });
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>
            Manage organization profile and basic settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex gap-2">
                <span className="font-medium w-32">Email:</span>
                <span>{user.email || "—"}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium w-32">User ID:</span>
                <span className="font-mono text-xs text-gray-500">
                  {user.sub || "—"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium w-32">Organisation:</span>
                <span>{user["custom:Organisation"] || "Not set"}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading user info...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
