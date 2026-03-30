"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddGoalModal({ open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("carbon");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setCategory("carbon");
    setTarget("");
    setUnit("");
    setDeadline("");
    setError(null);
    setSaving(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    setError(null);

    if (!title || !category || !target || !unit || !deadline) {
      setError("Please fill in all fields.");
      return;
    }

    setSaving(true);
    try {
      await api.createGoal({
        title,
        category,
        target: Number(target),
        unit,
        deadline,
        progress: 0,
        status: "on-track",
      });

      onCreated(); // refresh parent list
      handleClose();
    } catch (err: any) {
      console.error("createGoal failed:", err);

      // Surface a meaningful message — 401 means token issue
      if (
        err.message?.includes("401") ||
        err.message?.includes("Not authenticated")
      ) {
        setError("Session expired. Please log out and log back in.");
      } else {
        setError(err.message || "Failed to save goal. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="space-y-4">
        <DialogHeader>
          <DialogTitle>Create Sustainability Goal</DialogTitle>
        </DialogHeader>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium">Goal Title</label>
          <input
            className="w-full border p-2 rounded"
            placeholder="e.g. Carbon Neutral by 2030"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Category</label>
          <select
            className="w-full border p-2 rounded"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="carbon">Carbon</option>
            <option value="energy">Energy</option>
            <option value="waste">Waste</option>
            <option value="water">Water</option>
            <option value="supply-chain">Supply Chain</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Target</label>
          <input
            type="number"
            className="w-full border p-2 rounded"
            placeholder="e.g. 100"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Unit</label>
          <input
            className="w-full border p-2 rounded"
            placeholder="e.g. % or kg CO2e"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Deadline</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
