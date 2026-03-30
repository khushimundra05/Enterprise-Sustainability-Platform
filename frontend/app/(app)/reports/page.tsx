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
import { Plus, Download, FileText, Share2, Eye } from "lucide-react";
import api, {
  Emission,
  EnergyRecord,
  Report,
  WaterRecord,
  WasteRecord,
} from "@/lib/api";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function loadReports() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReports();
      setReports(
        (data || []).sort(
          (a, b) =>
            new Date(b.generated).getTime() - new Date(a.generated).getTime(),
        ),
      );
    } catch (err: any) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const totalDownloads = useMemo(
    () => reports.reduce((acc, r) => acc + (r.downloads || 0), 0),
    [reports],
  );

  async function handleGenerate() {
    setGenerating(true);
    try {
      const [emissions, energy, water, waste] = await Promise.all([
        api.getEmissions(),
        api.getEnergy(),
        api.getWater(),
        api.getWaste(),
      ]);

      const totalEmissions = (emissions || []).reduce(
        (s: number, r: Emission) => s + (r.amount || 0),
        0,
      );
      const totalEnergy = (energy || []).reduce(
        (s: number, r: EnergyRecord) => s + (r.consumption || 0),
        0,
      );
      const renewableEnergy = (energy || [])
        .filter((r: EnergyRecord) =>
          r.source?.toLowerCase().includes("renewable"),
        )
        .reduce((s: number, r: EnergyRecord) => s + (r.consumption || 0), 0);
      const totalWater = (water || []).reduce(
        (s: number, r: WaterRecord) => s + (r.consumption || 0),
        0,
      );
      const totalWaste = (waste || []).reduce(
        (s: number, r: WasteRecord) => s + (r.amount || 0),
        0,
      );
      const recycledWaste = (waste || [])
        .filter((r: any) => r.type?.toLowerCase() === "recycled")
        .reduce((s: number, r: WasteRecord) => s + (r.amount || 0), 0);

      const renewableEnergyPercent =
        totalEnergy > 0 ? Math.round((renewableEnergy / totalEnergy) * 100) : 0;
      const wasteRecycledPercent =
        totalWaste > 0 ? Math.round((recycledWaste / totalWaste) * 100) : 0;

      const now = new Date();
      const label = `${now.toLocaleString("default", { month: "short" })} ${now.getFullYear()}`;

      await api.generateReport({
        title: `${label} Sustainability Report`,
        emissions: totalEmissions,
        renewableEnergy: renewableEnergyPercent,
        waterUsage: totalWater,
        wasteRecycled: wasteRecycledPercent,
      } as any);

      await loadReports();
    } catch (err: any) {
      alert(err.message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload(report: Report) {
    try {
      const res = await api.downloadReport(report.id!);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      // Refresh to show incremented download count
      await loadReports();
    } catch (err: any) {
      alert(err.message || "Download failed");
    }
  }

  async function handleView(report: Report) {
    try {
      const res = await api.downloadReport(report.id!);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err: any) {
      alert(err.message || "View failed");
    }
  }

  const typeBadge = (type: string) => {
    const map: Record<string, string> = {
      quarterly: "bg-blue-100 text-blue-700",
      annual: "bg-green-100 text-green-700",
      compliance: "bg-purple-100 text-purple-700",
      sustainability: "bg-teal-100 text-teal-700",
      Quarterly: "bg-blue-100 text-blue-700",
    };
    return (
      <Badge
        className={`${map[type] ?? "bg-gray-100 text-gray-700"} hover:opacity-90`}
      >
        {type || "Report"}
      </Badge>
    );
  };

  const statusBadge = (status: string) => (
    <Badge
      className={
        status === "published"
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700"
      }
    >
      {status === "published" ? "Published" : "Draft"}
    </Badge>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600">
            Generate and manage sustainability reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-green-600 hover:bg-green-700 gap-2"
            onClick={handleGenerate}
            disabled={generating}
          >
            <Plus className="h-4 w-4" />{" "}
            {generating ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Reports", value: reports.length, sub: "Generated" },
          {
            label: "Published",
            value: reports.filter((r) => r.status === "published").length,
            sub: "Public reports",
          },
          { label: "Total Downloads", value: totalDownloads, sub: "All time" },
          {
            label: "Last Generated",
            value: reports[0]?.generated
              ? new Date(reports[0].generated).toLocaleString("default", {
                  month: "short",
                })
              : "—",
            sub: reports[0]?.generated
              ? String(new Date(reports[0].generated).getFullYear())
              : "",
          },
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

      {/* Report list */}
      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
          <CardDescription>
            View, download, and manage all sustainability reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded flex justify-between">
                <span>{error}</span>
                <button onClick={loadReports} className="underline">
                  Retry
                </button>
              </div>
            )}
            {loading && (
              <p className="text-sm text-gray-500">Loading reports...</p>
            )}
            {!loading && !error && reports.length === 0 && (
              <p className="text-sm text-gray-500">
                No reports yet. Click "Generate Report" to create your first
                one.
              </p>
            )}

            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">{report.title}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(report.generated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {typeBadge((report as any).type || "Quarterly")}
                    {statusBadge((report as any).status || "published")}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Emissions</p>
                    <p className="font-semibold">
                      {((report.emissions || 0) / 1000).toFixed(1)}K kg CO₂
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Renewable Energy</p>
                    <p className="font-semibold">
                      {report.renewableEnergy || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Water Usage</p>
                    <p className="font-semibold">
                      {((report.waterUsage || 0) / 1000).toFixed(1)}K L
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Downloads</p>
                    <p className="font-semibold">{report.downloads || 0}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                    onClick={() => handleView(report)}
                  >
                    <Eye className="h-4 w-4" /> View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                    onClick={() => handleDownload(report)}
                  >
                    <Download className="h-4 w-4" /> Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
