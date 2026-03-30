"use client";

import { useEffect, useState, useMemo } from "react";
import AIRecommendations from "@/components/AIRecommendations";
import api, { ComplianceRecord } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Download,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  X,
} from "lucide-react";

type Regulation = ComplianceRecord & {
  status: "Compliant" | "Pending" | "Non-Compliant";
  createdAt?: string;
};

const EMPTY_FORM = {
  title: "",
  description: "",
  dueDate: "",
  status: "Pending",
  lastAudit: "",
};

export default function CompliancePage() {
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editReg, setEditReg] = useState<Regulation | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [viewReg, setViewReg] = useState<Regulation | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilter, setShowFilter] = useState(false);

  async function loadRegulations() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCompliance();
      setRegulations((data || []) as Regulation[]);
    } catch (err: any) {
      setError(err.message || "Failed to load regulations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRegulations();
  }, []);

  async function handleSubmit() {
    if (!form.title || !form.dueDate) {
      setFormError("Title and due date are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await api.createCompliance(form);
      setShowModal(false);
      setForm(EMPTY_FORM);
      await loadRegulations();
    } catch (err: any) {
      setFormError(err.message || "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(reg: Regulation) {
    setEditReg(reg);
    setEditForm({
      title: reg.title || "",
      description: reg.description || "",
      dueDate: reg.dueDate || "",
      status: reg.status || "Pending",
      lastAudit: reg.lastAudit || "",
    });
    setEditError(null);
  }

  async function handleEdit() {
    if (!editReg?.id || !editForm.title || !editForm.dueDate) {
      setEditError("Title and due date are required.");
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      await api.updateCompliance(editReg.id, editForm);
      setEditReg(null);
      await loadRegulations();
    } catch (err: any) {
      setEditError(err.message || "Failed to update");
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteRegulation(id: string) {
    if (!confirm("Delete this regulation?")) return;
    try {
      await api.deleteCompliance(id);
      await loadRegulations();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  }

  function exportCSV() {
    const rows = filteredRegulations.map((r) =>
      [r.title, r.description, r.dueDate, r.status, r.lastAudit || "N/A"]
        .map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`)
        .join(","),
    );
    const csv = ["Title,Description,Due Date,Status,Last Audit", ...rows].join(
      "\n",
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "compliance.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function daysUntilDue(dueDate: string): number | null {
    if (!dueDate) return null;
    return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  }

  function daysLabel(days: number | null) {
    if (days === null) return <span className="text-gray-400">—</span>;
    if (days < 0)
      return (
        <span className="text-red-600 font-medium">
          Overdue ({Math.abs(days)}d)
        </span>
      );
    if (days === 0)
      return <span className="text-red-600 font-medium">Due today</span>;
    if (days <= 30)
      return <span className="text-orange-500 font-medium">{days} days</span>;
    return <span className="text-gray-600">{days} days</span>;
  }

  const statusIcon = (s: string) =>
    s === "Compliant" ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : s === "Non-Compliant" ? (
      <XCircle className="h-5 w-5 text-red-600" />
    ) : (
      <Clock className="h-5 w-5 text-yellow-500" />
    );

  const statusStyle = (s: string) =>
    s === "Compliant"
      ? "bg-green-100 text-green-700 border border-green-200"
      : s === "Non-Compliant"
        ? "bg-red-100 text-red-700 border border-red-200"
        : "bg-yellow-100 text-yellow-700 border border-yellow-200";

  const rowStyle = (s: string) =>
    s === "Compliant"
      ? "border-l-4 border-l-green-400 bg-green-50/30"
      : s === "Non-Compliant"
        ? "border-l-4 border-l-red-400 bg-red-50/30"
        : "border-l-4 border-l-yellow-400 bg-yellow-50/30";

  const filteredRegulations = useMemo(
    () =>
      statusFilter === "all"
        ? regulations
        : regulations.filter((r) => r.status === statusFilter),
    [regulations, statusFilter],
  );

  const compliant = regulations.filter((r) => r.status === "Compliant").length;
  const pending = regulations.filter((r) => r.status === "Pending").length;
  const nonCompliant = regulations.filter(
    (r) => r.status === "Non-Compliant",
  ).length;
  const compRate =
    regulations.length > 0
      ? Math.round((compliant / regulations.length) * 100)
      : 0;

  const FormFields = ({
    f,
    setF,
  }: {
    f: typeof EMPTY_FORM;
    setF: (v: typeof EMPTY_FORM) => void;
  }) => (
    <div className="space-y-3">
      <input
        placeholder="Title *"
        className="border p-2 w-full rounded text-sm"
        value={f.title}
        onChange={(e) => setF({ ...f, title: e.target.value })}
      />
      <input
        placeholder="Description"
        className="border p-2 w-full rounded text-sm"
        value={f.description}
        onChange={(e) => setF({ ...f, description: e.target.value })}
      />
      <div>
        <label className="text-xs text-gray-500">Due Date *</label>
        <input
          type="date"
          className="border p-2 w-full rounded text-sm mt-1"
          value={f.dueDate}
          onChange={(e) => setF({ ...f, dueDate: e.target.value })}
        />
      </div>
      <select
        className="border p-2 w-full rounded text-sm"
        value={f.status}
        onChange={(e) => setF({ ...f, status: e.target.value })}
      >
        <option value="Pending">Pending</option>
        <option value="Compliant">Compliant</option>
        <option value="Non-Compliant">Non-Compliant</option>
      </select>
      <div>
        <label className="text-xs text-gray-500">Last Audit Date</label>
        <input
          type="date"
          className="border p-2 w-full rounded text-sm mt-1"
          value={f.lastAudit}
          onChange={(e) => setF({ ...f, lastAudit: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Compliance & Regulations</h1>
          <p className="text-gray-500">
            Manage regulatory requirements and certifications
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Button
              variant="outline"
              className="gap-2 bg-transparent"
              onClick={() => setShowFilter(!showFilter)}
            >
              <Filter className="h-4 w-4" /> Filter
            </Button>
            {showFilter && (
              <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg w-44 z-10">
                {["all", "Compliant", "Pending", "Non-Compliant"].map((s) => (
                  <button
                    key={s}
                    className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-50 ${statusFilter === s ? "font-semibold text-green-600" : ""}`}
                    onClick={() => {
                      setStatusFilter(s);
                      setShowFilter(false);
                    }}
                  >
                    {s === "all" ? "All Statuses" : s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={exportCSV}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 gap-2"
            onClick={() => {
              setForm(EMPTY_FORM);
              setFormError(null);
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add Regulation
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            title: "Total Regulations",
            value: regulations.length,
            sub: "Being tracked",
            subColor: "",
          },
          {
            title: "Compliant",
            value: compliant,
            sub: `${compRate}% compliance rate`,
            subColor: "text-green-600",
          },
          {
            title: "Non-Compliant",
            value: nonCompliant,
            sub: nonCompliant > 0 ? "Requires immediate action" : "All clear",
            subColor: nonCompliant > 0 ? "text-red-600" : "text-green-600",
          },
          {
            title: "Pending Review",
            value: pending,
            sub: pending > 0 ? "In progress" : "None pending",
            subColor: pending > 0 ? "text-orange-500" : "",
          },
        ].map(({ title, value, sub, subColor }) => (
          <div key={title} className="border rounded-lg p-4 bg-white shadow-sm">
            <p className="text-gray-500 text-sm">{title}</p>
            <h2 className="text-2xl font-bold mt-1">{value}</h2>
            <p className={`text-xs mt-1 ${subColor || "text-gray-400"}`}>
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <AIRecommendations />

      {/* Error / Loading */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded flex justify-between">
          <span>{error}</span>
          <button onClick={loadRegulations} className="underline">
            Retry
          </button>
        </div>
      )}
      {loading && !error && (
        <div className="text-gray-500 text-sm py-4 text-center">
          Loading regulations...
        </div>
      )}

      {/* List */}
      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-lg">Regulatory Requirements</h2>
          <p className="text-sm text-gray-500">
            Track compliance status for all applicable regulations
          </p>
        </div>
        {!loading && filteredRegulations.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">
            {statusFilter !== "all"
              ? `No ${statusFilter} regulations.`
              : "No regulations yet."}{" "}
            {statusFilter === "all" && (
              <button
                className="text-green-600 underline"
                onClick={() => setShowModal(true)}
              >
                Add one
              </button>
            )}
          </div>
        )}
        <div className="divide-y">
          {filteredRegulations.map((reg) => {
            const days = daysUntilDue(reg.dueDate);
            return (
              <div key={reg.id} className={`p-6 ${rowStyle(reg.status)}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">{statusIcon(reg.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          {reg.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyle(reg.status)}`}
                        >
                          {reg.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {reg.description}
                      </p>
                      <div className="grid grid-cols-3 gap-6 mt-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Due Date</p>
                          <p className="font-medium">{reg.dueDate || "—"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">
                            Days Until Due
                          </p>
                          <p>{daysLabel(days)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Last Audit</p>
                          <p className="font-medium">
                            {reg.lastAudit || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewReg(reg)}
                    >
                      View Details
                    </Button>
                    <div className="flex gap-2">
                      <button
                        className="text-blue-600 text-sm hover:underline"
                        onClick={() => openEdit(reg)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-500 text-sm hover:underline"
                        onClick={() => deleteRegulation(reg.id!)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[440px] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add Regulation</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
                {formError}
              </div>
            )}
            <FormFields f={form} setF={setForm} />
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="border px-4 py-2 rounded text-sm"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editReg && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[440px] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Edit Regulation</h2>
              <button onClick={() => setEditReg(null)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
                {editError}
              </div>
            )}
            <FormFields f={editForm} setF={setEditForm} />
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="border px-4 py-2 rounded text-sm"
                onClick={() => setEditReg(null)}
              >
                Cancel
              </button>
              <button
                disabled={editSaving}
                onClick={handleEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
              >
                {editSaving ? "Saving..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewReg && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[480px] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {statusIcon(viewReg.status)}
                <h2 className="text-xl font-semibold">{viewReg.title}</h2>
              </div>
              <button onClick={() => setViewReg(null)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <span
              className={`inline-block px-3 py-1 rounded text-sm font-medium ${statusStyle(viewReg.status)}`}
            >
              {viewReg.status}
            </span>
            <p className="text-sm text-gray-600">
              {viewReg.description || "No description provided."}
            </p>
            <div className="grid grid-cols-2 gap-4 border rounded-lg p-4 bg-gray-50 text-sm">
              <div>
                <p className="text-xs text-gray-500">Due Date</p>
                <p className="font-medium">{viewReg.dueDate || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Days Until Due</p>
                <p>{daysLabel(daysUntilDue(viewReg.dueDate))}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Audit</p>
                <p className="font-medium">{viewReg.lastAudit || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="font-medium">
                  {viewReg.createdAt
                    ? new Date(viewReg.createdAt).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setViewReg(null);
                  openEdit(viewReg);
                }}
              >
                Edit Regulation
              </Button>
              <Button onClick={() => setViewReg(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
