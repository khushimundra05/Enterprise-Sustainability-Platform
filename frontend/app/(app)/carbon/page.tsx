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
  ResponsiveContainer,
} from "recharts";
import { Plus, Download } from "lucide-react";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Carbon Emissions</h1>
          <p className="text-gray-600">
            Track and manage carbon footprint across all operations
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="border rounded px-2 py-1 text-sm"
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
            className="border rounded px-2 py-1 text-sm"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <input
            type="date"
            className="border rounded px-2 py-1 text-sm"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={exportCSV}
            className="gap-2 bg-transparent"
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            onClick={() => setOpenModal(true)}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <Plus className="h-4 w-4" /> Log Emission
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded flex justify-between">
          <span>{error}</span>
          <button onClick={loadEmissions} className="underline">
            Retry
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Emissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalEmissions.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">kg CO₂e</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average per Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {monthlyAverage.toFixed(0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">kg CO₂e</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Records Logged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredEmissions.length}</div>
            <p className="text-xs text-gray-500 mt-1">entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Emissions by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="emissions"
                    stroke="#059669"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Emissions Log</CardTitle>
          <CardDescription>Latest entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Source</th>
                  <th className="text-left py-3 px-4">Facility</th>
                  <th className="text-right py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Notes</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading && filteredEmissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500">
                      No emissions recorded yet
                    </td>
                  </tr>
                )}
                {filteredEmissions.map((e) => (
                  <tr key={e.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{e.date}</td>
                    <td className="py-3 px-4">{e.source}</td>
                    <td className="py-3 px-4">{e.facility || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      {e.amount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">{e.notes || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        className="text-red-600 hover:underline"
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
