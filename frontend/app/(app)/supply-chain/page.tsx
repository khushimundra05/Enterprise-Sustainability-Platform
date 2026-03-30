"use client";

import AddSupplierModal from "@/components/add-supplier-modal";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download } from "lucide-react";
import api, { Supplier } from "@/lib/api";

export default function SupplyChainPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);

  async function loadSuppliers() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSuppliers();
      setSuppliers(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function handleAssess(id: string) {
    try {
      await api.assessSupplier(id);
      await loadSuppliers();
    } catch (err: any) {
      alert(err.message || "Assessment failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this supplier?")) return;
    try {
      await api.deleteSupplier(id);
      await loadSuppliers();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  }

  async function handleExport() {
    try {
      const res = await api.exportSuppliers();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "suppliers.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Export failed");
    }
  }

  function calculateRisk(s: Supplier) {
    let score = 0;
    if ((s.carbonFootprint || 0) > 20000) score += 40;
    else if ((s.carbonFootprint || 0) > 10000) score += 25;
    if (!s.certifications || s.certifications.length === 0) score += 25;
    else if (s.certifications.length === 1) score += 10;
    if (s.lastAssessment) {
      const months =
        (new Date().getFullYear() - new Date(s.lastAssessment).getFullYear()) *
          12 +
        new Date().getMonth() -
        new Date(s.lastAssessment).getMonth();
      if (months > 12) score += 15;
    }
    return Math.min(score, 100);
  }

  const riskLabel = (r: number) =>
    r < 30 ? "Low" : r < 60 ? "Medium" : "High";
  const riskStyle = (r: number) =>
    r < 30
      ? "bg-green-100 text-green-700"
      : r < 60
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";
  const riskBar = (r: number) =>
    r < 30 ? "bg-green-500" : r < 60 ? "bg-yellow-500" : "bg-red-500";

  const totalCarbon = suppliers.reduce(
    (s, x) => s + (x.carbonFootprint || 0),
    0,
  );
  const certifiedCount = suppliers.filter(
    (s) => s.certifications?.length > 0,
  ).length;
  const highRiskCount = suppliers.filter((s) => calculateRisk(s) > 60).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supply Chain</h1>
          <p className="text-gray-600">
            Monitor supplier sustainability and compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 gap-2"
            onClick={() => setOpenModal(true)}
          >
            <Plus className="h-4 w-4" /> Add Supplier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            title: "Total Suppliers",
            value: suppliers.length,
            sub: "Active relationships",
          },
          {
            title: "Supply Chain Carbon",
            value: `${(totalCarbon / 1000).toFixed(1)}K`,
            sub: "kg CO₂e",
          },
          {
            title: "Certified Suppliers",
            value: certifiedCount,
            sub: "ISO / B Corp",
          },
          {
            title: "High-Risk Suppliers",
            value: highRiskCount,
            sub: "Require attention",
            danger: true,
          },
        ].map(({ title, value, sub, danger }) => (
          <Card key={title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${danger ? "text-red-600" : ""}`}
              >
                {value}
              </div>
              <p className="text-xs text-gray-500 mt-2">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded flex justify-between">
          <span>{error}</span>
          <button onClick={loadSuppliers} className="underline">
            Retry
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Supplier Sustainability Profile</CardTitle>
          <CardDescription>
            Monitor supplier performance and risk levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="text-sm text-gray-500 py-4">Loading suppliers...</p>
          )}
          {!loading && suppliers.length === 0 && !error && (
            <p className="text-sm text-gray-500 py-4">
              No suppliers yet. Add your first supplier.
            </p>
          )}
          <div className="space-y-4">
            {suppliers.map((supplier) => {
              const risk = calculateRisk(supplier);
              return (
                <div
                  key={supplier.id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div>
                      <h3 className="font-semibold">{supplier.name}</h3>
                      <p className="text-sm text-gray-600">
                        {supplier.category}
                      </p>
                      {supplier.location && (
                        <p className="text-xs text-gray-400">
                          {supplier.location}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Carbon Footprint</p>
                      <p className="font-semibold">
                        {supplier.carbonFootprint
                          ? `${(supplier.carbonFootprint / 1000).toFixed(1)}K kg`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Certifications</p>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {supplier.certifications?.length ? (
                          supplier.certifications.map((c) => (
                            <Badge
                              key={c}
                              variant="secondary"
                              className="text-xs"
                            >
                              {c}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">None</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Assessment</p>
                      <p className="text-sm">
                        {supplier.lastAssessment || "Never"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded text-sm font-semibold ${riskStyle(risk)}`}
                      >
                        {riskLabel(risk)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-gray-600">Risk Score</p>
                        <p className="text-xs font-semibold">{risk}/100</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${riskBar(risk)}`}
                          style={{ width: `${risk}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssess(supplier.id!)}
                      >
                        Assess
                      </Button>
                      <button
                        className="text-red-500 text-sm hover:underline"
                        onClick={() => handleDelete(supplier.id!)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AddSupplierModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={loadSuppliers}
      />
    </div>
  );
}
