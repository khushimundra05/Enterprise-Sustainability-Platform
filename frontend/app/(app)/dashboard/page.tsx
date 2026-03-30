"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
} from "lucide-react";
import api, {
  Emission,
  EnergyRecord,
  WaterRecord,
  WasteRecord,
  Goal,
} from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const MONTH_ORDER = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function DashboardPage() {
  const router = useRouter();
  const [emissions, setEmissions] = useState<Emission[]>([]);
  const [energy, setEnergy] = useState<EnergyRecord[]>([]);
  const [water, setWater] = useState<WaterRecord[]>([]);
  const [waste, setWaste] = useState<WasteRecord[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [e, en, w, wa, g] = await Promise.all([
          api.getEmissions(),
          api.getEnergy(),
          api.getWater(),
          api.getWaste(),
          api.getGoals(),
        ]);
        setEmissions(e || []);
        setEnergy(en || []);
        setWater(w || []);
        setWaste(wa || []);
        setGoals((g || []).slice(0, 4));
      } catch (err) {
        console.error("Dashboard load error", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalEmissions = useMemo(
    () => emissions.reduce((s, r) => s + (r.amount || 0), 0),
    [emissions],
  );
  const totalEnergy = useMemo(
    () => energy.reduce((s, r) => s + (r.consumption || 0), 0),
    [energy],
  );
  const totalWater = useMemo(
    () => water.reduce((s, r) => s + (r.consumption || 0), 0),
    [water],
  );
  const totalWaste = useMemo(
    () => waste.reduce((s, r) => s + (r.amount || 0), 0),
    [waste],
  );

  const renewableEnergyPercent = useMemo(() => {
    if (!totalEnergy) return 0;
    const renewable = energy
      .filter((r) => r.source?.toLowerCase().includes("renewable"))
      .reduce((s, r) => s + (r.consumption || 0), 0);
    return Math.round((renewable / totalEnergy) * 100);
  }, [energy, totalEnergy]);

  const carbonBySource = useMemo(() => {
    const map: Record<string, number> = {};
    emissions.forEach((e) => {
      if (e.source) map[e.source] = (map[e.source] || 0) + (e.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [emissions]);

  const trendData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    emissions.forEach((e) => {
      if (!e.date) return;
      const m = new Date(e.date).toLocaleString("default", { month: "short" });
      byMonth[m] = (byMonth[m] || 0) + (e.amount || 0);
    });
    return MONTH_ORDER.filter((m) => byMonth[m]).map((m) => ({
      month: m,
      emissions: +(byMonth[m] / 1000).toFixed(1),
    }));
  }, [emissions]);

  const colors = ["#10b981", "#059669", "#047857", "#065f46"];

  const kpis = [
    {
      label: "Total Carbon Emissions",
      value:
        totalEmissions > 0
          ? `${(totalEmissions / 1_000_000).toFixed(2)}M kg`
          : "0 kg",
      sub: "CO₂e total",
      link: "/carbon",
    },
    {
      label: "Renewable Energy",
      value: `${renewableEnergyPercent}%`,
      sub: "of total consumption",
      link: "/energy",
    },
    {
      label: "Water Usage",
      value: totalWater > 0 ? `${(totalWater / 1000).toFixed(1)}K L` : "0 L",
      sub: "total consumption",
      link: "/water",
    },
    {
      label: "Waste Tracked",
      value: totalWaste > 0 ? `${(totalWaste / 1000).toFixed(1)}K kg` : "0 kg",
      sub: "total waste logged",
      link: "/waste",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">Your sustainability overview</p>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700 gap-2"
          onClick={() => router.push("/reports")}
        >
          <Plus className="h-4 w-4" /> Generate Report
        </Button>
      </div>

      {loading && (
        <div className="text-gray-400 text-sm py-4">
          Loading dashboard data...
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, link }) => (
          <Card
            key={label}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(link)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{value}</div>
              <p className="text-xs text-gray-500 mt-2">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Carbon by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {carbonBySource.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
                No emissions data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={carbonBySource}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ value }) => `${(value / 1000).toFixed(0)}K`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {carbonBySource.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => `${(Number(v) / 1000).toFixed(1)}K kg`}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Emissions Trend</CardTitle>
            <CardDescription>
              Monthly CO₂ emissions (thousands kg)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
                No trend data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="emissions"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Emissions (K kg)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goals */}
      {goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sustainability Goals Progress</CardTitle>
            <CardDescription>Tracking progress toward targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{goal.title}</p>
                      <p className="text-sm text-gray-600">
                        Target: {goal.target} {goal.unit}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        goal.status === "on-track"
                          ? "bg-green-100 text-green-700"
                          : goal.status === "at-risk"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {goal.status === "on-track"
                        ? "On Track"
                        : goal.status === "at-risk"
                          ? "At Risk"
                          : "Behind"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-right">
                    {goal.progress}% complete
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Emission records",
            value: emissions.length,
            link: "/carbon",
          },
          { label: "Energy records", value: energy.length, link: "/energy" },
          { label: "Water records", value: water.length, link: "/water" },
          { label: "Waste records", value: waste.length, link: "/waste" },
        ].map(({ label, value, link }) => (
          <div
            key={label}
            className="border rounded-lg p-4 bg-white cursor-pointer hover:shadow-sm transition-shadow"
            onClick={() => router.push(link)}
          >
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
