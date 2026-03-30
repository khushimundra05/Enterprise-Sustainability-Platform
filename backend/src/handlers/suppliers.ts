/**
 * suppliers.ts handler
 *
 * Thin layer: extracts userId, calls service, returns response.
 * Zero DynamoDB imports here.
 */
import { APIGatewayProxyHandler } from "aws-lambda";
import {
  getAllSuppliers,
  createSupplier,
  assessSupplier,
  deleteSupplier,
} from "../services/suppliersService";
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

// GET /suppliers
export const getSuppliers: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const items = await getAllSuppliers(userId);
    return ok(items);
  } catch (err: any) {
    console.error("getSuppliers error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// POST /suppliers
export const createSupplier_: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) return badRequest("Missing request body");
    const userId = getUserId(event);
    const data = JSON.parse(event.body);
    const item = await createSupplier(userId, data);
    return created(item);
  } catch (err: any) {
    console.error("createSupplier error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// PUT /suppliers/{id}/assess
export const assessSupplier_: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing supplier id");

    const userId = getUserId(event);
    const body = JSON.parse(event.body || "{}");
    await assessSupplier(id, userId, body.riskScore || 0);
    return ok({ message: "Assessment updated" });
  } catch (err: any) {
    console.error("assessSupplier error:", err);
    if (err.message === "Not found") return notFound();
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// DELETE /suppliers/{id}
export const deleteSupplier_: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing supplier id");

    const userId = getUserId(event);
    await deleteSupplier(id, userId);
    return ok({ message: "Supplier deleted" });
  } catch (err: any) {
    console.error("deleteSupplier error:", err);
    if (err.message === "Not found") return notFound();
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// GET /suppliers/export
export const exportSuppliers: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const items = await getAllSuppliers(userId);

    const csvHeaders = [
      "name",
      "category",
      "location",
      "carbonFootprint",
      "certifications",
      "riskScore",
      "lastAssessment",
    ];

    const csv = [
      csvHeaders.join(","),
      ...items.map((s) =>
        [
          s.name ?? "",
          s.category ?? "",
          s.location ?? "",
          s.carbonFootprint ?? 0,
          Array.isArray(s.certifications) ? s.certifications.join("|") : "",
          s.riskScore ?? 0,
          s.lastAssessment ?? "",
        ]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");

    return {
      statusCode: 200,
      headers: CSV_HEADERS("suppliers.csv"),
      body: csv,
    };
  } catch (err: any) {
    console.error("exportSuppliers error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

// Re-export with correct names matching serverless.yml
export {
  createSupplier_ as createSupplier,
  assessSupplier_ as assessSupplier,
  deleteSupplier_ as deleteSupplier,
};
