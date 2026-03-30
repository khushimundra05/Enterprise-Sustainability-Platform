/**
 * emissions.ts handler
 *
 * Thin layer: extracts userId, calls emissionsService, returns response.
 * Zero DynamoDB imports here.
 */
import { APIGatewayProxyHandler } from "aws-lambda";
import {
  getAllEmissions,
  createEmission,
  deleteEmission,
} from "../services/emissionsService";
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

// GET /emissions
export const getEmissions: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const items = await getAllEmissions(userId);
    return ok(items);
  } catch (err: any) {
    console.error("getEmissions error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// POST /emissions
export const createEmission_: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) return badRequest("Missing request body");
    const userId = getUserId(event);
    const data = JSON.parse(event.body);
    const item = await createEmission(userId, data);
    return created(item);
  } catch (err: any) {
    console.error("createEmission error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// DELETE /emissions/{id}
export const deleteEmission_: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing id");

    const userId = getUserId(event);
    await deleteEmission(id, userId);
    return ok({ success: true });
  } catch (err: any) {
    console.error("deleteEmission error:", err);
    if (err.message === "Not found") return notFound();
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

export { createEmission_ as createEmission, deleteEmission_ as deleteEmission };
