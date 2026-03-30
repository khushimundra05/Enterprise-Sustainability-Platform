"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Download, Filter } from "lucide-react";
import api from "@/lib/api";

type Team = {
  id?: string;
  name: string;
  lead: string;
  members: string[] | string;
  responsibilities: string[] | string;
  projectsActive: number;
};

const EMPTY_FORM = {
  name: "",
  lead: "",
  members: "",
  responsibilities: "",
  projectsActive: 0,
};

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadTeams() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTeams();
      setTeams(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeams();
  }, []);

  // Normalise members/responsibilities — backend stores arrays, old data may be strings
  function toArray(val: string[] | string | undefined): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function toDisplay(val: string[] | string | undefined): string {
    return toArray(val).join(", ");
  }

  async function createTeam() {
    if (!form.name || !form.lead) {
      setFormError("Name and lead are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await api.createTeam({
        name: form.name,
        lead: form.lead,
        members: form.members
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        responsibilities: form.responsibilities
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        projectsActive: Number(form.projectsActive),
      });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await loadTeams();
    } catch (err: any) {
      setFormError(err.message || "Failed to create team");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(team: Team) {
    setSelectedTeam(team);
    setForm({
      name: team.name || "",
      lead: team.lead || "",
      members: toDisplay(team.members),
      responsibilities: toDisplay(team.responsibilities),
      projectsActive: team.projectsActive ?? 0,
    });
    setFormError(null);
    setShowEdit(true);
  }

  async function updateTeam() {
    if (!selectedTeam?.id) return;
    setSaving(true);
    setFormError(null);
    try {
      await api.updateTeam(selectedTeam.id, {
        name: form.name,
        lead: form.lead,
        members: form.members
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        responsibilities: form.responsibilities
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        projectsActive: Number(form.projectsActive),
      });
      setShowEdit(false);
      await loadTeams();
    } catch (err: any) {
      setFormError(err.message || "Failed to update team");
    } finally {
      setSaving(false);
    }
  }

  async function handleFilter(min: number) {
    setShowFilter(false);
    if (min === 0) {
      loadTeams();
      return;
    }
    try {
      const data = await api.filterTeams(min);
      setTeams(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Filter failed");
    }
  }

  async function handleExport() {
    try {
      const res = await api.exportTeams();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "teams.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || "Export failed");
    }
  }

  // KPI calculations — safe because teams is always an array now
  const activeTeams = teams.length;
  const teamMembers = teams.reduce(
    (sum, t) => sum + toArray(t.members).length,
    0,
  );
  const projectsActive = teams.reduce(
    (sum, t) => sum + (t.projectsActive || 0),
    0,
  );

  const TeamForm = ({
    onSave,
    onCancel,
    title,
  }: {
    onSave: () => void;
    onCancel: () => void;
    title: string;
  }) => (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[440px] space-y-3 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
            {formError}
          </div>
        )}
        {[
          { placeholder: "Team Name *", key: "name" },
          { placeholder: "Team Lead *", key: "lead" },
          { placeholder: "Members (comma separated)", key: "members" },
          {
            placeholder: "Responsibilities (comma separated)",
            key: "responsibilities",
          },
        ].map(({ placeholder, key }) => (
          <input
            key={key}
            placeholder={placeholder}
            className="border p-2 w-full rounded text-sm"
            value={(form as any)[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        ))}
        <input
          type="number"
          placeholder="Projects Active"
          className="border p-2 w-full rounded text-sm"
          value={form.projectsActive}
          onChange={(e) =>
            setForm({ ...form, projectsActive: Number(e.target.value) })
          }
        />
        <div className="flex justify-end gap-2 pt-2">
          <button
            className="border px-4 py-2 rounded text-sm"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={onSave}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Team Collaboration</h1>
          <p className="text-gray-500">
            Manage teams and coordinate sustainability initiatives
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowFilter(!showFilter)}
            >
              <Filter className="h-4 w-4 mr-1" /> Filter
            </Button>
            {showFilter && (
              <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg w-44 z-10">
                {[
                  { label: "All", min: 0 },
                  { label: "1+ Projects", min: 1 },
                  { label: "2+ Projects", min: 2 },
                  { label: "3+ Projects", min: 3 },
                ].map(({ label, min }) => (
                  <button
                    key={min}
                    className="block w-full px-4 py-2 text-sm hover:bg-gray-100 text-left"
                    onClick={() => handleFilter(min)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => {
              setForm(EMPTY_FORM);
              setFormError(null);
              setShowCreate(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Create Team
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Teams", value: activeTeams },
          { label: "Team Members", value: teamMembers },
          { label: "Projects Active", value: projectsActive },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded flex justify-between">
          <span>{error}</span>
          <button onClick={loadTeams} className="underline">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-gray-500 text-sm py-8 text-center">
          Loading teams...
        </div>
      )}

      {/* Empty */}
      {!loading && !error && teams.length === 0 && (
        <div className="text-gray-400 text-sm py-8 text-center">
          No teams yet.{" "}
          <button
            className="text-green-600 underline"
            onClick={() => setShowCreate(true)}
          >
            Create your first team
          </button>
        </div>
      )}

      {/* Team cards */}
      <div className="space-y-5">
        {teams.map((team) => {
          const members = toArray(team.members);
          const responsibilities = toArray(team.responsibilities);

          return (
            <div
              key={team.id}
              className="border p-6 rounded-lg bg-white shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{team.name}</h3>
                  <p className="text-gray-500 text-sm">Led by {team.lead}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(team)}
                >
                  Edit
                </Button>
              </div>

              {members.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium text-sm mb-2">
                    Team Members ({members.length})
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {members.map((m, i) => (
                      <div
                        key={i}
                        className="border rounded p-2 flex items-center gap-2"
                      >
                        <div className="w-7 h-7 bg-green-200 rounded-full flex items-center justify-center text-sm font-bold text-green-800">
                          {m[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm truncate">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {responsibilities.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {responsibilities.map((r, i) => (
                    <span
                      key={i}
                      className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-4 text-sm text-gray-600">
                Projects Active: <b>{team.projectsActive || 0}</b>
              </p>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <TeamForm
          title="Create Team"
          onSave={createTeam}
          onCancel={() => setShowCreate(false)}
        />
      )}
      {showEdit && (
        <TeamForm
          title="Edit Team"
          onSave={updateTeam}
          onCancel={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}
