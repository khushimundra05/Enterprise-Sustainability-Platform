/**
 * compliance.ts handler
 *
 * Thin layer: extracts userId, calls service, returns response.
 * AI recommendations call is here because it orchestrates two things
 * (DB fetch + OpenAI call) — the service handles each separately.
 */
import { APIGatewayProxyHandler } from "aws-lambda";
import {
  getAllCompliance,
  createCompliance,
  updateCompliance,
  deleteCompliance,
} from "../services/complianceService";
import { generateRecommendations } from "../services/openai";
import { getUserId } from "../utils/getUserId";
import {
  ok,
  created,
  notFound,
  badRequest,
  unauthorized,
  serverError,
  isAuthError,
} from "../utils/response";

// GET /compliance
export const getCompliance: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const items = await getAllCompliance(userId);
    return ok(items);
  } catch (err: any) {
    console.error("getCompliance error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// POST /compliance
export const createCompliance_: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) return badRequest("Missing request body");
    const userId = getUserId(event);
    const data = JSON.parse(event.body);
    const item = await createCompliance(userId, data);
    return created(item);
  } catch (err: any) {
    console.error("createCompliance error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// PUT /compliance/{id}
export const updateCompliance_: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing id");
    if (!event.body) return badRequest("Missing request body");

    const userId = getUserId(event);
    const data = JSON.parse(event.body);
    const updated = await updateCompliance(id, userId, data);
    return ok(updated);
  } catch (err: any) {
    console.error("updateCompliance error:", err);
    if (err.message === "Not found") return notFound();
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// DELETE /compliance/{id}
export const deleteCompliance_: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing id");

    const userId = getUserId(event);
    await deleteCompliance(id, userId);
    return ok({ message: "Deleted" });
  } catch (err: any) {
    console.error("deleteCompliance error:", err);
    if (err.message === "Not found") return notFound();
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// GET /compliance/recommendations
export const getRecommendations: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const items = await getAllCompliance(userId);
    const advice = await generateRecommendations(items);
    return ok({ advice });
  } catch (err: any) {
    console.error("getRecommendations error:", err);
    return isAuthError(err)
      ? unauthorized(err.message)
      : serverError("Failed to generate AI insights");
  }
};

export {
  createCompliance_ as createCompliance,
  updateCompliance_ as updateCompliance,
  deleteCompliance_ as deleteCompliance,
};
