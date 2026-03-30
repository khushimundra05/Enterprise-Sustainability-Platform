"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function AddEmissionModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    source: "",
    facility: "",
    amount: "",
    date: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function reset() {
    setForm({ source: "", facility: "", amount: "", date: "", notes: "" });
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    setError(null);
    if (!form.source || !form.amount || !form.date) {
      setError("Source, amount and date are required.");
      return;
    }
    try {
      setLoading(true);
      await api.createEmission({
        source: form.source,
        facility: form.facility,
        amount: Number(form.amount),
        date: form.date,
        notes: form.notes,
      });
      onCreated();
      handleClose();
    } catch (err: any) {
      console.error("createEmission failed:", err);
      setError(err.message || "Failed to create emission. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Emission</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>Source</Label>
            <select
              name="source"
              value={form.source}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">Select Source</option>
              <option value="Supply Chain">Supply Chain</option>
              <option value="Transportation">Transportation</option>
              <option value="Energy">Energy</option>
            </select>
          </div>
          <div>
            <Label>Facility</Label>
            <Input
              name="facility"
              value={form.facility}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Amount (kg CO2e)</Label>
            <Input
              name="amount"
              type="number"
              step={100}
              min={0}
              value={form.amount}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Date</Label>
            <Input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Input name="notes" value={form.notes} onChange={handleChange} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
