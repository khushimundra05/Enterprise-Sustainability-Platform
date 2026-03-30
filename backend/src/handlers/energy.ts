/**
 * energy.ts handler
 *
 * Thin layer: extracts userId, calls energyService, returns response.
 * Zero DynamoDB imports here.
 */
import { APIGatewayProxyHandler } from "aws-lambda";
import {
  getAllEnergy,
  createEnergy,
  deleteEnergy,
} from "../services/energyService";
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

// GET /energy
export const getEnergy: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const items = await getAllEnergy(userId);
    return ok(items);
  } catch (err: any) {
    console.error("getEnergy error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// POST /energy
export const createEnergyRecord: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) return badRequest("Missing request body");
    const userId = getUserId(event);
    const data = JSON.parse(event.body);
    const item = await createEnergy(userId, data);
    return created(item);
  } catch (err: any) {
    console.error("createEnergy error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// DELETE /energy/{id}
export const deleteEnergyRecord: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing id");

    const userId = getUserId(event);
    await deleteEnergy(id, userId);
    return ok({ success: true });
  } catch (err: any) {
    console.error("deleteEnergy error:", err);
    if (err.message === "Not found") return notFound();
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};
