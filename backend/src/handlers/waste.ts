/**
 * waste.ts handler
 *
 * Thin layer: extracts userId, calls wasteService, returns response.
 * Zero DynamoDB imports here.
 */
import { APIGatewayProxyHandler } from "aws-lambda";
import {
  getAllWaste,
  createWaste,
  deleteWaste,
} from "../services/wasteService";
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

// GET /waste
export const getWaste: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const items = await getAllWaste(userId);
    return ok(items);
  } catch (err: any) {
    console.error("getWaste error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// POST /waste
export const createWaste_: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) return badRequest("Missing request body");
    const userId = getUserId(event);
    const data = JSON.parse(event.body);
    const item = await createWaste(userId, data);
    return created(item);
  } catch (err: any) {
    console.error("createWaste error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// DELETE /waste/{id}
export const deleteWaste_: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing id");

    const userId = getUserId(event);
    await deleteWaste(id, userId);
    return ok({ success: true });
  } catch (err: any) {
    console.error("deleteWaste error:", err);
    if (err.message === "Not found") return notFound();
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

export { createWaste_ as createWaste, deleteWaste_ as deleteWaste };
