"use client";

import AddEmissionModal from "@/components/add-emission-modal";
import { useEffect, useState } from "react";
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Plus, Download, Wind, TrendingUp } from "lucide-react";
import { ChartWrapper } from "@/components/chart-wrapper";
import api, { Emission as EmissionType } from "@/lib/api";

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

export default function CarbonPage() {
  const [emissions, setEmissions] = useState<EmissionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function loadEmissions() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEmissions();
      setEmissions(data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load emissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmissions();
  }, []);

  const filteredEmissions = emissions.filter((e) => {
    if (sourceFilter !== "all" && e.source !== sourceFilter) return false;
    if (fromDate && e.date < fromDate) return false;
    if (toDate && e.date > toDate) return false;
    return true;
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this emission?")) return;
    try {
      await api.deleteEmission(id);
      await loadEmissions();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  }

  const totalEmissions = filteredEmissions.reduce(
    (s, e) => s + (e.amount || 0),
    0,
  );
  const monthlyAverage =
    filteredEmissions.length > 0
      ? totalEmissions / filteredEmissions.length
      : 0;

  const monthlyMap: Record<string, number> = {};
  filteredEmissions.forEach((e) => {
    if (!e.date) return;
    const m = new Date(e.date).toLocaleString("default", { month: "short" });
    monthlyMap[m] = (monthlyMap[m] || 0) + (e.amount || 0);
  });
  const monthlyData = MONTH_ORDER.filter((m) => monthlyMap[m]).map((m) => ({
    month: m,
    emissions: monthlyMap[m],
  }));

  const sourceMap: Record<string, number> = {};
  filteredEmissions.forEach((e) => {
    if (e.source)
      sourceMap[e.source] = (sourceMap[e.source] || 0) + (e.amount || 0);
  });
  const sourceData = Object.entries(sourceMap).map(([source, value]) => ({
    source,
    value,
  }));

  function exportCSV() {
    if (!filteredEmissions.length) return;
    const rows = filteredEmissions.map((e) =>
      [e.date, e.source, e.facility || "", e.amount, e.notes || ""].join(","),
    );
    const csv = ["Date,Source,Facility,Amount,Notes", ...rows].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "emissions.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Carbon Emissions</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage carbon footprint across all operations
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="border border-border/50 rounded-lg px-3 py-2 text-sm bg-background text-foreground"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">All Sources</option>
            <option value="Energy">Energy</option>
            <option value="Transportation">Transportation</option>
            <option value="Supply Chain">Supply Chain</option>
          </select>
          <input
            type="date"
            className="border border-border/50 rounded-lg px-3 py-2 text-sm bg-background text-foreground"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <input
            type="date"
            className="border border-border/50 rounded-lg px-3 py-2 text-sm bg-background text-foreground"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={exportCSV}
            className="gap-2"
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            onClick={() => setOpenModal(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Log Emission
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg flex justify-between">
          <span>{error}</span>
          <button onClick={loadEmissions} className="font-semibold underline hover:opacity-80 transition-opacity">
            Retry
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 group cursor-default hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Total Emissions
              </CardTitle>
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                <Wind className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">
              {(totalEmissions / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground mt-2">kg CO₂e</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 group cursor-default hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Average per Entry
              </CardTitle>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">
              {monthlyAverage.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">kg CO₂e</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 group cursor-default hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Records Logged
              </CardTitle>
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                <Wind className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{filteredEmissions.length}</div>
            <p className="text-xs text-muted-foreground mt-2">entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper
          title="Emissions by Source"
          description="Breakdown of emissions across sources"
          icon={Wind}
          isEmpty={sourceData.length === 0}
          height="h-[300px]"
          emptyMessage="No emission data to display"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sourceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="source" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
        <ChartWrapper
          title="Monthly Trend"
          description="Carbon emissions over time"
          icon={TrendingUp}
          isEmpty={monthlyData.length === 0}
          height="h-[300px]"
          emptyMessage="No trend data to display"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
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
                name="Emissions (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl">Recent Emissions Log</CardTitle>
          <CardDescription>Latest entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/20">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Source</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Facility</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Notes</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading emissions...
                    </td>
                  </tr>
                )}
                {!loading && filteredEmissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No emissions recorded yet
                    </td>
                  </tr>
                )}
                {filteredEmissions.map((e) => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                    <td className="py-3 px-4 text-foreground">{e.date}</td>
                    <td className="py-3 px-4 text-foreground">{e.source}</td>
                    <td className="py-3 px-4 text-muted-foreground">{e.facility || "—"}</td>
                    <td className="py-3 px-4 text-right font-medium text-foreground">
                      {e.amount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{e.notes || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        className="text-destructive hover:text-destructive/80 font-medium transition-colors"
                        onClick={() => handleDelete(e.id!)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddEmissionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={loadEmissions}
      />
    </div>
  );
}
