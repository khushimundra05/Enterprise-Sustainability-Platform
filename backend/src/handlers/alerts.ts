/**
 * alerts.ts handler
 *
 * Endpoints:
 * - GET /alerts
 * - POST /alerts/check-anomalies
 * - PUT /alerts/{id}
 */
import { APIGatewayProxyHandler } from "aws-lambda";
import { getUserId } from "../utils/getUserId";
import {
  ok,
  created,
  badRequest,
  notFound,
  unauthorized,
  serverError,
  isAuthError,
} from "../utils/response";
import {
  getAllAlerts,
  createAlert,
  updateAlertStatus,
} from "../services/alertsService";
import { detectAnomalies } from "../services/anomalyEngine";
import { getAllEmissions } from "../services/emissionsService";
import { getAllEnergy } from "../services/energyService";
import { getAllWater } from "../services/waterService";
import { getAllWaste } from "../services/wasteService";

// 🔥 SNS IMPORT
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sns = new SNSClient({ region: "ap-south-1" });

export const getAlerts: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const items = await getAllAlerts(userId);
    return ok(items);
  } catch (err: any) {
    console.error("getAlerts error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

export const checkAnomalies: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);

    const [emissions, energy, water, waste] = await Promise.all([
      getAllEmissions(userId),
      getAllEnergy(userId),
      getAllWater(userId),
      getAllWaste(userId),
    ]);

    const candidates = await detectAnomalies({
      emissions,
      energy,
      water,
      waste,
    });

    const existing = await getAllAlerts(userId);
    const active = existing.filter((a) => a.status !== "resolved");

    const candidateTypes = new Set(candidates.map((c) => c.type));

    // Resolve old alerts that are no longer anomalies
    for (const a of active) {
      if (!candidateTypes.has(a.type)) {
        await updateAlertStatus(a.id!, userId, "resolved");
      }
    }

    const activeTypes = new Set(active.map((a) => a.type));
    const toCreate = candidates.filter((c) => !activeTypes.has(c.type));

    // 🚀 CREATE ALERTS + SEND SNS EMAIL
    const createdAlerts = await Promise.all(
      toCreate.map(async (a) => {
        const alert = await createAlert(userId, {
          type: a.type,
          title: a.title,
          description: a.description,
          severity: a.severity,
          affectedArea: a.affectedArea,
          status: a.status,
        });

        // 🔔 SNS EMAIL TRIGGER
        await sns.send(
          new PublishCommand({
            TopicArn: process.env.SNS_TOPIC_ARN!,
            Subject: "🚨 Sustainability Alert",
            Message: `
New anomaly detected!

Type: ${a.type}
Severity: ${a.severity}
Area: ${a.affectedArea}

${a.description}

Please review immediately.
            `,
          }),
        );

        return alert;
      }),
    );

    return created({ created: createdAlerts.length, alerts: createdAlerts });
  } catch (err: any) {
    console.error("checkAnomalies error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

export const updateAlert: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing id");
    if (!event.body) return badRequest("Missing request body");

    const userId = getUserId(event);
    const body = JSON.parse(event.body);
    const status = body.status;
    if (!status) return badRequest("Missing status");

    const updated = await updateAlertStatus(id, userId, status);
    return ok(updated);
  } catch (err: any) {
    console.error("updateAlert error:", err);
    if (err.message === "Not found") return notFound();
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};
