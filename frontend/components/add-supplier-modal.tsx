"use client";

import { useState } from "react";
import api from "@/lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function AddSupplierModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Logistics");
  const [location, setLocation] = useState("");
  const [carbon, setCarbon] = useState("");
  const [certs, setCerts] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleClose() {
    setError(null);
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) {
      setError("Supplier name is required.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await api.createSupplier({
        name,
        category,
        location,
        carbonFootprint: Number(carbon) || 0,
        certifications: certs ? certs.split(",").map((c) => c.trim()) : [],
      });
      onCreated();
      handleClose();
      setName("");
      setCategory("Logistics");
      setLocation("");
      setCarbon("");
      setCerts("");
    } catch (err: any) {
      console.error("createSupplier failed:", err);
      setError(err.message || "Failed to add supplier.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Add Supplier</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded mb-3">
            {error}
          </div>
        )}

        <form className="space-y-3" onSubmit={submit}>
          <input
            placeholder="Name *"
            className="w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select
            className="w-full border p-2 rounded"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Logistics</option>
            <option>Manufacturing</option>
            <option>Packaging</option>
          </select>

          <input
            placeholder="Location"
            className="w-full border p-2 rounded"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <input
            type="number"
            placeholder="Carbon Footprint (kg)"
            className="w-full border p-2 rounded"
            value={carbon}
            onChange={(e) => setCarbon(e.target.value)}
          />

          <input
            placeholder="Certifications (comma separated)"
            className="w-full border p-2 rounded"
            value={certs}
            onChange={(e) => setCerts(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="border px-4 py-2 rounded"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
