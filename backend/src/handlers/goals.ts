/**
 * goals.ts handler
 *
 * Fixes:
 * - Added missing deleteGoal, filterGoals, exportGoals (were in serverless.yml but not implemented)
 * - updateGoal now derives status automatically in the service layer
 * - All responses use shared response helpers
 */
import { APIGatewayProxyHandler } from "aws-lambda";
import {
  getAllGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} from "../services/goalsService";
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

// GET /goals
export const getGoals: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const items = await getAllGoals(userId);
    return ok(items);
  } catch (err: any) {
    console.error("getGoals error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// POST /goals
export const createGoal_: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) return badRequest("Missing request body");
    const userId = getUserId(event);
    const data = JSON.parse(event.body);
    const item = await createGoal(userId, data);
    return created(item);
  } catch (err: any) {
    console.error("createGoal error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// PUT /goals/{id}
export const updateGoal_: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing id");
    if (!event.body) return badRequest("Missing request body");

    const userId = getUserId(event);
    const { progress } = JSON.parse(event.body);
    await updateGoal(id, userId, Number(progress));
    return ok({ message: "Goal updated" });
  } catch (err: any) {
    console.error("updateGoal error:", err);
    if (err.message === "Not found") return notFound();
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// DELETE /goals/{id}
export const deleteGoal_: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing id");

    const userId = getUserId(event);
    await deleteGoal(id, userId);
    return ok({ message: "Goal deleted" });
  } catch (err: any) {
    console.error("deleteGoal error:", err);
    if (err.message === "Not found") return notFound();
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// GET /goals/filter?category=X&status=Y
export const filterGoals: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const { category, status } = event.queryStringParameters || {};

    let items = await getAllGoals(userId);

    if (category) items = items.filter((g) => g.category === category);
    if (status) items = items.filter((g) => g.status === status);

    return ok(items);
  } catch (err: any) {
    console.error("filterGoals error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// GET /goals/export
export const exportGoals: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const items = await getAllGoals(userId);

    const csv = [
      "title,category,target,unit,deadline,progress,status",
      ...items.map((g) =>
        [
          g.title,
          g.category,
          g.target,
          g.unit,
          g.deadline,
          g.progress,
          g.status,
        ]
          .map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");

    return {
      statusCode: 200,
      headers: CSV_HEADERS("goals.csv"),
      body: csv,
    };
  } catch (err: any) {
    console.error("exportGoals error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

export {
  createGoal_ as createGoal,
  updateGoal_ as updateGoal,
  deleteGoal_ as deleteGoal,
};
