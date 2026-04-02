/**
 * env.ts
 *
 * Single source of truth for all environment config.
 * Every handler and service must import table names from here —
 * never use process.env.X_TABLE directly in handler files.
 */
import "dotenv/config";

export const REGION = process.env.AWS_REGION || "ap-south-1";

export const TABLES = {
  EMISSIONS: process.env.EMISSIONS_TABLE || "EmissionsTable",
  ENERGY: process.env.ENERGY_TABLE || "EnergyTable",
  WATER: process.env.WATER_TABLE || "WaterTable",
  WASTE: process.env.WASTE_TABLE || "WasteTable",
  SUPPLIERS: process.env.SUPPLIERS_TABLE || "SuppliersTable",
  COMPLIANCE: process.env.COMPLIANCE_TABLE || "ComplianceTable",
  GOALS: process.env.GOALS_TABLE || "GoalsTable",
  TEAMS: process.env.TEAMS_TABLE || "TeamsTable",
  REPORTS: process.env.REPORTS_TABLE || "ReportsTable",
  ALERTS: process.env.ALERTS_TABLE || "AlertsTable",
  RECOMMENDATIONS: process.env.RECOMMENDATIONS_TABLE || "RecommendationsTable",
};

export const CORS = {
  ORIGIN: process.env.CORS_ORIGIN || "*",
};

export const COGNITO = {
  USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || "",
  CLIENT_ID: process.env.COGNITO_CLIENT_ID || "",
  REGION: process.env.AWS_REGION || "ap-south-1",
};

export const AI = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  // Optional: override model names without code changes
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
  // Optional: external ML service for anomaly detection (HTTP endpoint)
  ANOMALY_MODEL_URL: process.env.ANOMALY_MODEL_URL || "",
};
