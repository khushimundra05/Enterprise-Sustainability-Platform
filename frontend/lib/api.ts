/**
 * api.ts — Frontend API client
 *
 * Fixes applied:
 * - LOCAL_USER_ID and x-user-id header removed entirely — identity comes from JWT only
 * - getToken() now reads from sessionStorage (set by auth.ts after Cognito login)
 * - All export-style fetch calls unified to use the shared request() function
 * - aws-config.ts should be DELETED — AWS credentials do not belong in the frontend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

function getToken(): string | null {
  // auth.ts stores the Cognito ID token here after login
  return sessionStorage.getItem("idToken");
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    // Token expired — clear session and redirect to login
    sessionStorage.removeItem("idToken");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }

  return res.json();
}

// Shared fetch helper for binary responses (exports, downloads)
async function requestRaw(path: string): Promise<Response> {
  const token = getToken();

  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }

  return res;
}

/* =========================
   EMISSIONS
========================= */
export type Emission = {
  id?: string;
  userId?: string;
  source: string;
  amount: number;
  date: string;
  facility?: string;
  notes?: string;
  createdAt?: string;
};

async function getEmissions(): Promise<Emission[]> {
  return request("/emissions");
}

async function createEmission(emission: Partial<Emission>) {
  return request("/emissions", {
    method: "POST",
    body: JSON.stringify(emission),
  });
}

async function deleteEmission(id: string) {
  return request(`/emissions/${id}`, { method: "DELETE" });
}

/* =========================
   ENERGY
========================= */
export type EnergyRecord = {
  id?: string;
  source: string;
  facility: string;
  consumption: number;
  date: string;
};

async function getEnergy(): Promise<EnergyRecord[]> {
  return request("/energy");
}

async function createEnergy(record: Partial<EnergyRecord>) {
  return request("/energy", { method: "POST", body: JSON.stringify(record) });
}

async function deleteEnergy(id: string) {
  return request(`/energy/${id}`, { method: "DELETE" });
}

/* =========================
   WATER
========================= */
export type WaterRecord = {
  id?: string;
  source: string;
  consumption: number;
  date: string;
  facility?: string;
  notes?: string;
};

async function getWater(): Promise<WaterRecord[]> {
  return request("/water");
}

async function createWater(record: Partial<WaterRecord>) {
  return request("/water", { method: "POST", body: JSON.stringify(record) });
}

async function deleteWater(id: string) {
  return request(`/water/${id}`, { method: "DELETE" });
}

/* =========================
   WASTE
========================= */
export type WasteRecord = {
  id?: string;
  date: string;
  type: string;
  facility?: string;
  amount: number;
};

async function getWaste(): Promise<WasteRecord[]> {
  return request("/waste");
}

async function createWaste(data: Partial<WasteRecord>) {
  return request("/waste", { method: "POST", body: JSON.stringify(data) });
}

async function deleteWaste(id: string) {
  return request(`/waste/${id}`, { method: "DELETE" });
}

/* =========================
   SUPPLIERS
========================= */
export type Supplier = {
  id?: string;
  name: string;
  category: string;
  location?: string;
  carbonFootprint?: number;
  certifications?: string[];
  riskScore?: number;
  lastAssessment?: string;
};

async function getSuppliers(): Promise<Supplier[]> {
  return request("/suppliers");
}

async function createSupplier(data: Partial<Supplier>) {
  return request("/suppliers", { method: "POST", body: JSON.stringify(data) });
}

async function assessSupplier(id: string) {
  return request(`/suppliers/${id}/assess`, { method: "PUT" });
}

async function deleteSupplier(id: string) {
  return request(`/suppliers/${id}`, { method: "DELETE" });
}

async function exportSuppliers() {
  return requestRaw("/suppliers/export");
}

/* =========================
   GOALS
========================= */
export type Goal = {
  id?: string;
  title: string;
  category: string;
  target: number;
  unit: string;
  deadline: string;
  progress: number;
  status: "on-track" | "at-risk" | "behind";
};

async function getGoals(): Promise<Goal[]> {
  return request("/goals");
}

async function createGoal(goal: Partial<Goal>) {
  return request("/goals", { method: "POST", body: JSON.stringify(goal) });
}

async function updateGoal(id: string, progress: number) {
  return request(`/goals/${id}`, {
    method: "PUT",
    body: JSON.stringify({ progress }),
  });
}

/* =========================
   COMPLIANCE
========================= */
export type ComplianceRecord = {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  status: string;
  lastAudit?: string | null;
};

async function getCompliance(): Promise<ComplianceRecord[]> {
  return request("/compliance");
}

async function createCompliance(record: Partial<ComplianceRecord>) {
  return request("/compliance", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

async function updateCompliance(id: string, record: Partial<ComplianceRecord>) {
  return request(`/compliance/${id}`, {
    method: "PUT",
    body: JSON.stringify(record),
  });
}

async function deleteCompliance(id: string) {
  return request(`/compliance/${id}`, { method: "DELETE" });
}

async function getComplianceRecommendations() {
  return request("/compliance/recommendations");
}

/* =========================
   TEAMS
========================= */
async function getTeams() {
  return request("/teams");
}

async function createTeam(payload: any) {
  return request("/teams", { method: "POST", body: JSON.stringify(payload) });
}

async function updateTeam(id: string, payload: any) {
  return request(`/teams/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

async function filterTeams(projects: number) {
  return request(`/teams/filter?projects=${projects}`);
}

async function exportTeams() {
  return requestRaw("/teams/export");
}

/* =========================
   REPORTS
========================= */
export type Report = {
  id?: string;
  title: string;
  generated: string;
  emissions: number;
  renewableEnergy: number;
  waterUsage: number;
  wasteRecycled: number;
  downloads?: number;
};

async function getReports(): Promise<Report[]> {
  return request("/reports");
}

async function generateReport(payload: Partial<Report>) {
  return request("/reports/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function exportReports() {
  return requestRaw("/reports/export");
}

async function downloadReport(id: string) {
  return requestRaw(`/reports/${id}/download`);
}

/* =========================
   EXPORT
========================= */
export default {
  getEmissions,
  createEmission,
  deleteEmission,
  getEnergy,
  createEnergy,
  deleteEnergy,
  getWater,
  createWater,
  deleteWater,
  getWaste,
  createWaste,
  deleteWaste,
  getSuppliers,
  createSupplier,
  assessSupplier,
  deleteSupplier,
  exportSuppliers,
  getGoals,
  createGoal,
  updateGoal,
  getCompliance,
  createCompliance,
  updateCompliance,
  deleteCompliance,
  getComplianceRecommendations,
  getTeams,
  createTeam,
  updateTeam,
  filterTeams,
  exportTeams,
  getReports,
  generateReport,
  exportReports,
  downloadReport,
};
