"use client";

import { useState } from "react";
import api from "@/lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function AddWasteModal({ open, onClose, onCreated }: Props) {
  const [type, setType] = useState("General");
  const [facility, setFacility] = useState("");
  const [method, setMethod] = useState("Landfill");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleClose() {
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date) {
      setError("Amount and date are required.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await api.createWaste({
        type,
        facility,
        disposalMethod: method,
        amount: Number(amount),
        date,
      });
      onCreated();
      handleClose();
      setType("General");
      setFacility("");
      setMethod("Landfill");
      setAmount("");
      setDate("");
    } catch (err: any) {
      console.error("createWaste failed:", err);
      setError(err.message || "Failed to create waste record.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-xl font-semibold">Log Waste</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            className="w-full border rounded px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option>General</option>
            <option>Recycled</option>
            <option>Organic</option>
            <option>Hazardous</option>
          </select>

          <input
            type="text"
            placeholder="Facility"
            className="w-full border rounded px-3 py-2"
            value={facility}
            onChange={(e) => setFacility(e.target.value)}
          />

          <select
            className="w-full border rounded px-3 py-2"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option>Landfill</option>
            <option>Recycling</option>
            <option>Composting</option>
            <option>Incineration</option>
          </select>

          <input
            type="number"
            placeholder="Amount (kg)"
            className="w-full border rounded px-3 py-2"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />

          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded border"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
