/**
 * water.ts handler
 *
 * Thin layer: extracts userId, calls waterService, returns response.
 * Zero DynamoDB imports here.
 */
import { APIGatewayProxyHandler } from "aws-lambda";
import {
  getAllWater,
  createWater,
  deleteWater,
} from "../services/waterService";
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

// GET /water
export const getWater: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const items = await getAllWater(userId);
    return ok(items);
  } catch (err: any) {
    console.error("getWater error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// POST /water
export const createWater_: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) return badRequest("Missing request body");
    const userId = getUserId(event);
    const data = JSON.parse(event.body);
    const item = await createWater(userId, data);
    return created(item);
  } catch (err: any) {
    console.error("createWater error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// DELETE /water/{id}
export const deleteWater_: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing id");

    const userId = getUserId(event);
    await deleteWater(id, userId);
    return ok({ success: true });
  } catch (err: any) {
    console.error("deleteWater error:", err);
    if (err.message === "Not found") return notFound();
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

export { createWater_ as createWater, deleteWater_ as deleteWater };
