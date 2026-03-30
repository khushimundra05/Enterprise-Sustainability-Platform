"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function AddEnergyModal({ open, onClose, onCreated }: Props) {
  const [source, setSource] = useState("Electricity");
  const [facility, setFacility] = useState("");
  const [consumption, setConsumption] = useState<number>(0);
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
    setError(null);
    try {
      setLoading(true);
      await api.createEnergy({ source, facility, consumption, date });
      onCreated();
      handleClose();
    } catch (err: any) {
      console.error("createEnergy failed:", err);
      setError(err.message || "Failed to create energy record.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-xl font-semibold">Log Energy Usage</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            className="w-full border rounded px-3 py-2"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option>Electricity</option>
            <option>Renewable</option>
            <option>Natural Gas</option>
            <option>Solar</option>
          </select>

          <input
            type="text"
            placeholder="Facility"
            className="w-full border rounded px-3 py-2"
            value={facility}
            onChange={(e) => setFacility(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Consumption (kWh)"
            className="w-full border rounded px-3 py-2"
            value={consumption}
            onChange={(e) => setConsumption(Number(e.target.value))}
            required
          />

          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
