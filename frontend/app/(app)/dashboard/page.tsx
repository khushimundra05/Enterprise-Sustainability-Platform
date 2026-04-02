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
  Wind,
  Zap,
  Droplet,
  Trash2,
  Target as GoalIcon,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import api, {
  Emission,
  EnergyRecord,
  WaterRecord,
  WasteRecord,
  Goal,
} from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RecommendedActionsSection } from "@/components/dashboard/recommended-actions";
import { AnomalyAlertsSection } from "@/components/dashboard/anomaly-alerts";
import { GoalProgressSection } from "@/components/dashboard/goal-progress";

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

  const formatMetric = (val: number, isLiters = false) => {
    const unit = isLiters ? "L" : "kg";
    if (val === 0) return `0 ${unit}`;
    if (val < 1000) return `${Math.round(val)} ${unit}`;
    if (val < 1_000_000) return `${(val / 1000).toFixed(1)}K ${unit}`;
    return `${(val / 1_000_000).toFixed(2)}M ${unit}`;
  };

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
      emissions: byMonth[m],
    }));
  }, [emissions]);

  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
  ];

  const kpis = [
    {
      label: "Total Carbon Emissions",
      value: formatMetric(totalEmissions),
      sub: "CO₂e total",
      link: "/carbon",
      icon: Wind,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Renewable Energy",
      value: `${renewableEnergyPercent}%`,
      sub: "of total consumption",
      link: "/energy",
      icon: Zap,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Water Usage",
      value: formatMetric(totalWater, true),
      sub: "total consumption",
      link: "/water",
      icon: Droplet,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-100 dark:bg-cyan-900/30",
    },
    {
      label: "Waste Tracked",
      value: formatMetric(totalWaste),
      sub: "total waste logged",
      link: "/waste",
      icon: Trash2,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Your sustainability overview and key metrics
          </p>
        </div>
        <Button
          size="lg"
          className="gap-2"
          onClick={() => router.push("/reports")}
        >
          <Plus className="h-5 w-5" /> Generate Report
        </Button>
      </div>

      {loading && (
        <div className="text-muted-foreground text-sm py-8 flex items-center justify-center">
          <Activity className="h-5 w-5 mr-2 animate-pulse-subtle" />
          Loading dashboard data...
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map(({ label, value, sub, link, icon: KpiIcon, color, bg }) => (
          <Card
            key={label}
            className="group cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-300 border-border/50"
            onClick={() => router.push(link)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  {label}
                </CardTitle>
                <div
                  className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <KpiIcon className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold text-foreground">
                {value}
              </div>
              <p className="text-sm text-muted-foreground mt-3">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Carbon by Source</CardTitle>
                <CardDescription className="mt-1">
                  Emissions breakdown
                </CardDescription>
              </div>
              <Wind className="h-5 w-5 text-primary opacity-40" />
            </div>
          </CardHeader>
          <CardContent>
            {carbonBySource.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm rounded-lg bg-secondary/20">
                No emissions data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={carbonBySource}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value }) => `${name} (${formatMetric(value)})`}
                    outerRadius={70}
                    dataKey="value"
                  >
                    {carbonBySource.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatMetric(Number(v))}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Emissions Trend</CardTitle>
                <CardDescription className="mt-1">
                  Monthly CO₂ emissions tracking
                </CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-primary opacity-40" />
            </div>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm rounded-lg bg-secondary/20">
                No trend data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={(v) => formatMetric(Number(v))}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="emissions"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Emissions"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Emission records",
            value: emissions.length,
            link: "/carbon",
            icon: Wind,
            color: "text-green-600 dark:text-green-400",
          },
          {
            label: "Energy records",
            value: energy.length,
            link: "/energy",
            icon: Zap,
            color: "text-blue-600 dark:text-blue-400",
          },
          {
            label: "Water records",
            value: water.length,
            link: "/water",
            icon: Droplet,
            color: "text-cyan-600 dark:text-cyan-400",
          },
          {
            label: "Waste records",
            value: waste.length,
            link: "/waste",
            icon: Trash2,
            color: "text-orange-600 dark:text-orange-400",
          },
        ].map(({ label, value, link, icon: StatIcon, color }) => (
          <div
            key={label}
            className="border border-border/50 rounded-lg p-4 bg-card cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
            onClick={() => router.push(link)}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {label}
              </p>
              <StatIcon
                className={`h-4 w-4 ${color} opacity-60 group-hover:opacity-100 transition-opacity`}
              />
            </div>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* New Dashboard Sections */}
      <RecommendedActionsSection />
      <AnomalyAlertsSection />
      <GoalProgressSection />
    </div>
  );
}
