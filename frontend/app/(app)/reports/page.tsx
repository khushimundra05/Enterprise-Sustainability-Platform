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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Download, FileText, Share2, Eye, BarChart3, TrendingUp, Zap, Leaf } from "lucide-react";
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
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null);

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

  const reportTypes = [
    {
      id: "esg",
      label: "ESG Report",
      description: "Comprehensive Environmental, Social & Governance report",
      icon: Leaf,
      color: "bg-green-100/50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
    },
    {
      id: "quarterly",
      label: "Quarterly Summary",
      description: "Q-on-Q performance metrics and trends",
      icon: BarChart3,
      color: "bg-blue-100/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
    },
    {
      id: "annual",
      label: "Annual Report",
      description: "Full year sustainability performance",
      icon: TrendingUp,
      color: "bg-purple-100/50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
    },
    {
      id: "compliance",
      label: "CSRD Compliance",
      description: "Corporate Sustainability Reporting Directive aligned",
      icon: FileText,
      color: "bg-orange-100/50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400",
    },
  ];

  const typeBadge = (type: string) => {
    const map: Record<string, string> = {
      quarterly: "bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      annual: "bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
      compliance: "bg-orange-100/50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
      esg: "bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-400",
      Quarterly: "bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    };
    return (
      <Badge
        className={`${map[type] ?? "bg-secondary text-secondary-foreground"} hover:opacity-90`}
      >
        {type || "Report"}
      </Badge>
    );
  };

  const statusBadge = (status: string) => (
    <Badge
      variant={status === "published" ? "success" : "warning"}
    >
      {status === "published" ? "Published" : "Draft"}
    </Badge>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Generate and manage sustainability reports in multiple formats
          </p>
        </div>
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" /> Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Report Type</DialogTitle>
              <DialogDescription>
                Choose the type of sustainability report you want to generate
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {reportTypes.map((reportType) => {
                const IconComponent = reportType.icon;
                return (
                  <button
                    key={reportType.id}
                    onClick={() => {
                      setSelectedReportType(reportType.id);
                      setReportDialogOpen(false);
                      handleGenerate();
                    }}
                    className={`p-4 rounded-lg border-2 border-transparent transition-all hover:border-primary/50 hover:shadow-md ${reportType.color}`}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-6 w-6 mt-1 flex-shrink-0" />
                      <div className="text-left">
                        <h4 className="font-semibold mb-1">{reportType.label}</h4>
                        <p className="text-sm opacity-80">{reportType.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Reports", value: reports.length, sub: "Generated", icon: FileText },
          {
            label: "Published",
            value: reports.filter((r) => r.status === "published").length,
            sub: "Public reports",
            icon: TrendingUp,
          },
          { label: "Total Downloads", value: totalDownloads, sub: "All time", icon: Download },
          {
            label: "Last Generated",
            value: reports[0]?.generated
              ? new Date(reports[0].generated).toLocaleString("default", {
                  month: "short",
                })
              : "—",
            sub: reports[0]?.generated
              ? String(new Date(reports[0].generated).getFullYear())
              : "No reports",
            icon: BarChart3,
          },
        ].map(({ label, value, sub, icon: StatIcon }) => (
          <Card key={label} className="border-border/50 group cursor-default hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {label}
                </CardTitle>
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                  <StatIcon className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold text-foreground">{value}</div>
              {sub && <p className="text-xs text-muted-foreground mt-2">{sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report list */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl">All Reports</CardTitle>
          <CardDescription>
            View, download, and manage all sustainability reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg flex justify-between items-center">
                <span>{error}</span>
                <button onClick={loadReports} className="font-semibold underline hover:opacity-80 transition-opacity">
                  Retry
                </button>
              </div>
            )}
            {loading && (
              <div className="text-muted-foreground text-sm py-8 flex items-center justify-center">
                <div className="animate-pulse">Loading reports...</div>
              </div>
            )}
            {!loading && !error && reports.length === 0 && (
              <div className="text-center py-12 bg-secondary/20 rounded-lg border border-border/50">
                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No reports yet</p>
                <p className="text-sm text-muted-foreground/80 mt-1">Click "Generate Report" to create your first one.</p>
              </div>
            )}

            {reports.map((report) => (
              <div
                key={report.id}
                className="p-5 border border-border/50 rounded-lg hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{report.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.generated).toLocaleDateString()} {" · "} {new Date(report.generated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    {typeBadge((report as any).type || "Quarterly")}
                    {statusBadge((report as any).status || "published")}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 py-4 border-y border-border/50">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Emissions</p>
                    <p className="font-semibold text-foreground mt-1">
                      {((report.emissions || 0) / 1000).toFixed(1)}K kg CO₂
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Renewable Energy</p>
                    <p className="font-semibold text-foreground mt-1">
                      {report.renewableEnergy || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Water Usage</p>
                    <p className="font-semibold text-foreground mt-1">
                      {((report.waterUsage || 0) / 1000).toFixed(1)}K L
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Downloads</p>
                    <p className="font-semibold text-foreground mt-1">{report.downloads || 0}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleView(report)}
                  >
                    <Eye className="h-4 w-4" /> View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleDownload(report)}
                  >
                    <Download className="h-4 w-4" /> Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
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
