"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, TrendingUp, Target } from "lucide-react";
import api, { Goal, Emission, EnergyRecord } from "@/lib/api";
import AddGoalModal from "@/components/add-goal-modal";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    emissions: Emission[];
    energy: EnergyRecord[];
  }>({
    emissions: [],
    energy: [],
  });
  const [autoUpdated, setAutoUpdated] = useState(false);

  // ── Data loading ───────────────────────────────────────────────
  async function loadGoals() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGoals();
      setGoals(data || []);
    } catch (err: any) {
      console.error("loadGoals failed:", err);
      if (
        err.message?.includes("401") ||
        err.message?.includes("Not authenticated")
      ) {
        setError("Session expired — please log out and log back in.");
      } else {
        setError("Failed to load goals. Is the backend running?");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const [emissions, energy] = await Promise.all([
          api.getEmissions(),
          api.getEnergy(),
        ]);
        setMetrics({ emissions: emissions || [], energy: energy || [] });
      } catch (err) {
        // metrics are optional for display purposes — don't block the page
        console.error("Failed to load metrics for goals", err);
      }
    }
    loadMetrics();
  }, []);

  // ── Derived values ─────────────────────────────────────────────
  const filteredGoals = useMemo(() => {
    if (filterCategory === "all") return goals;
    return goals.filter((g) => g.category === filterCategory);
  }, [goals, filterCategory]);

  const aggregated = useMemo(() => {
    const totalEmissions = metrics.emissions.reduce(
      (sum, e) => sum + (e.amount || 0),
      0,
    );
    const totalEnergy = metrics.energy.reduce(
      (sum, r) => sum + (r.consumption || 0),
      0,
    );
    const renewableEnergy = metrics.energy
      .filter((r) => r.source?.toLowerCase().includes("renewable"))
      .reduce((sum, r) => sum + (r.consumption || 0), 0);
    const renewableShare =
      totalEnergy > 0 ? Math.round((renewableEnergy / totalEnergy) * 100) : 0;
    return { totalEmissions, totalEnergy, renewableShare };
  }, [metrics]);

  // ── Auto-progress model (runs once when data is ready) ─────────
  useEffect(() => {
    if (autoUpdated || goals.length === 0) return;
    if (!metrics.emissions.length && !metrics.energy.length) return;

    async function updateFromModel() {
      try {
        const updates = goals.map((g) => {
          let progress = g.progress;

          if (g.category === "carbon") {
            const baseline = aggregated.totalEmissions || 1;
            progress = Math.round(Math.min((g.target / baseline) * 100, 100));
          } else if (g.category === "energy") {
            const targetShare = g.target || 100;
            if (targetShare > 0) {
              progress = Math.round(
                Math.min((aggregated.renewableShare / targetShare) * 100, 100),
              );
            }
          }

          return { id: g.id!, progress };
        });

        await Promise.all(updates.map((u) => api.updateGoal(u.id, u.progress)));
        await loadGoals();
      } catch (err) {
        console.error("Auto-progress update failed", err);
      } finally {
        setAutoUpdated(true);
      }
    }

    updateFromModel();
  }, [goals, metrics, aggregated, autoUpdated]);

  // ── Handlers ───────────────────────────────────────────────────
  function exportGoals() {
    const csv = [
      ["Title", "Category", "Target", "Unit", "Progress", "Deadline"],
      ...goals.map((g) => [
        g.title,
        g.category,
        g.target,
        g.unit,
        g.progress,
        g.deadline,
      ]),
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csv]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "goals.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function editProgress(id: string) {
    const input = prompt("Enter new progress %");
    if (!input) return;
    try {
      await api.updateGoal(id, Number(input));
      await loadGoals();
    } catch (err: any) {
      alert(err.message || "Failed to update progress");
    }
  }

  // ── Stats ──────────────────────────────────────────────────────
  const onTrack = goals.filter((g) => g.status === "on-track").length;
  const atRisk = goals.filter((g) => g.status === "at-risk").length;
  const behind = goals.filter((g) => g.status === "behind").length;

  const statusColor = (status: string) =>
    ({
      "on-track": "bg-green-100 text-green-700",
      "at-risk": "bg-yellow-100 text-yellow-700",
      behind: "bg-red-100 text-red-700",
    })[status] ?? "bg-gray-100 text-gray-700";

  const statusLabel = (status: string) =>
    ({
      "on-track": "On Track",
      "at-risk": "At Risk",
      behind: "Behind",
    })[status] ?? status;

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Goals & Targets</h1>
          <p className="text-gray-600">
            Track sustainability targets and team progress
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className="border rounded p-2"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All</option>
            <option value="carbon">Carbon</option>
            <option value="energy">Energy</option>
            <option value="waste">Waste</option>
          </select>
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={exportGoals}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 gap-2"
            onClick={() => setGoalModalOpen(true)}
          >
            <Plus className="h-4 w-4" /> New Goal
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Goals",
            value: goals.length,
            sub: "Active sustainability goals",
          },
          { label: "On Track", value: onTrack },
          { label: "At Risk", value: atRisk },
          { label: "Behind Schedule", value: behind },
        ].map(({ label, value, sub }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{value}</div>
              {sub && <p className="text-xs text-gray-500 mt-2">{sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Goals list */}
      <Card>
        <CardHeader>
          <CardTitle>Organizational Goals</CardTitle>
          <CardDescription>Long-term sustainability targets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={loadGoals}>
                Retry
              </Button>
            </div>
          )}

          {/* Loading state */}
          {loading && !error && (
            <div className="text-gray-500 text-sm py-4 text-center">
              Loading goals...
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredGoals.length === 0 && (
            <div className="text-gray-400 text-sm py-8 text-center">
              No goals yet.{" "}
              <button
                className="text-green-600 underline"
                onClick={() => setGoalModalOpen(true)}
              >
                Create your first goal
              </button>
            </div>
          )}

          {/* Goal rows */}
          {filteredGoals.map((goal) => {
            const yearsRemaining = Math.ceil(
              (new Date(goal.deadline).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24 * 365),
            );

            return (
              <div key={goal.id} className="border-b pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">{goal.title}</h3>
                  </div>
                  <Badge className={statusColor(goal.status)}>
                    {statusLabel(goal.status)}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  Target: {goal.target} {goal.unit} • Deadline: {goal.deadline}
                </p>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 bg-green-600 rounded-full transition-all"
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between mt-3 text-sm">
                  <div>
                    Category: <b>{goal.category}</b>
                  </div>
                  <div>
                    Years Remaining: <b>{yearsRemaining}</b>
                  </div>
                  <div>
                    Progress: <b>{goal.progress}%</b>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editProgress(goal.id!)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recommended actions */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
          <CardDescription>
            Steps to accelerate progress toward goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: "green", text: "Accelerate renewable energy deployment" },
            { icon: "yellow", text: "Strengthen waste reduction initiatives" },
            { icon: "green", text: "Supply chain carbon accounting" },
          ].map(({ icon, text }) => (
            <div
              key={text}
              className="p-3 border rounded-lg flex items-center gap-2"
            >
              <TrendingUp className={`h-4 w-4 text-${icon}-600`} />
              {text}
            </div>
          ))}
        </CardContent>
      </Card>

      <AddGoalModal
        open={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        onCreated={loadGoals}
      />
    </div>
  );
}
