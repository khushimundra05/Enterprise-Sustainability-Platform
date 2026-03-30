/**
 * teams.ts handler
 *
 * Fixes:
 * - Added missing deleteTeam
 * - filterTeams now filters in memory after a proper userId-scoped query (not a full Scan)
 * - exportTeams properly quotes CSV values
 * - All responses use shared response helpers
 */
import { APIGatewayProxyHandler } from "aws-lambda";
import {
  getAllTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from "../services/teamsService";
import { getUserId } from "../utils/getUserId";
import {
  ok,
  created,
  notFound,
  badRequest,
  unauthorized,
  serverError,
  isAuthError,
  CSV_HEADERS,
} from "../utils/response";

// GET /teams
export const getTeams: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const items = await getAllTeams(userId);
    return ok(items);
  } catch (err: any) {
    console.error("getTeams error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// POST /teams
export const createTeam_: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) return badRequest("Missing request body");
    const userId = getUserId(event);
    const data = JSON.parse(event.body);
    const item = await createTeam(userId, data);
    return created(item);
  } catch (err: any) {
    console.error("createTeam error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// PUT /teams/{id}
export const updateTeam_: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing id");
    if (!event.body) return badRequest("Missing request body");

    const userId = getUserId(event);
    const data = JSON.parse(event.body);
    const updated = await updateTeam(id, userId, data);
    return ok(updated);
  } catch (err: any) {
    console.error("updateTeam error:", err);
    if (err.message === "Not found") return notFound();
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// DELETE /teams/{id}
export const deleteTeam_: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing id");

    const userId = getUserId(event);
    await deleteTeam(id, userId);
    return ok({ message: "Team deleted" });
  } catch (err: any) {
    console.error("deleteTeam error:", err);
    if (err.message === "Not found") return notFound();
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// GET /teams/filter?projects=N
// Queries only this user's teams, then filters in memory — no full table scan
export const filterTeams: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const minProjects = Number(event.queryStringParameters?.projects || 0);

    let items = await getAllTeams(userId);
    if (minProjects > 0) {
      items = items.filter((t) => t.projectsActive >= minProjects);
    }

    return ok(items);
  } catch (err: any) {
    console.error("filterTeams error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// GET /teams/export
export const exportTeams: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const items = await getAllTeams(userId);

    const csv = [
      "name,lead,members,projectsActive",
      ...items.map((t) =>
        [
          t.name,
          t.lead,
          Array.isArray(t.members) ? t.members.join("|") : "",
          t.projectsActive,
        ]
          .map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");

    return {
      statusCode: 200,
      headers: CSV_HEADERS("teams.csv"),
      body: csv,
    };
  } catch (err: any) {
    console.error("exportTeams error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

export {
  createTeam_ as createTeam,
  updateTeam_ as updateTeam,
  deleteTeam_ as deleteTeam,
};
