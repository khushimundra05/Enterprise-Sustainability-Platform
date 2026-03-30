/**
 * reportsService.ts
 *
 * All DynamoDB operations for reports.
 * Table key schema: userId (HASH) + id (RANGE)
 */
import {
  QueryCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { db } from "./dynamo";
import { TABLES } from "../utils/env";
import { Report } from "../models";

const TABLE = TABLES.REPORTS;

export async function getAllReports(userId: string): Promise<Report[]> {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    }),
  );

  const items = (res.Items || []) as Report[];
  return items.sort(
    (a, b) => new Date(b.generated).getTime() - new Date(a.generated).getTime(),
  );
}

export async function getReportById(
  id: string,
  userId: string,
): Promise<Report | null> {
  const res = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId, id } }),
  );
  return (res.Item as Report) || null;
}

export async function createReport(
  userId: string,
  data: Partial<Report>,
): Promise<Report> {
  const item: Report = {
    userId,
    id: uuid(),
    title: data.title || "Sustainability Report",
    generated: data.generated || new Date().toISOString(),
    type: "Quarterly",
    status: "published",
    downloads: 0,
    emissions: Number(data.emissions || 0),
    renewableEnergy: Number(data.renewableEnergy || 0),
    waterUsage: Number(data.waterUsage || 0),
    wasteRecycled: Number(data.wasteRecycled || 0),
  };

  await db.send(new PutCommand({ TableName: TABLE, Item: item }));
  return item;
}

export async function deleteReport(id: string, userId: string): Promise<void> {
  const existing = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId, id } }),
  );
  if (!existing.Item) throw new Error("Not found");

  await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId, id } }));
}

export async function incrementDownloads(
  id: string,
  userId: string,
): Promise<void> {
  // No ownership check needed here — getReportById is called first in the handler
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId, id },
      UpdateExpression:
        "SET downloads = if_not_exists(downloads, :zero) + :inc",
      ExpressionAttributeValues: { ":inc": 1, ":zero": 0 },
    }),
  );
}
