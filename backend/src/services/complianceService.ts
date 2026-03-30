/**
 * complianceService.ts
 *
 * All DynamoDB operations for compliance records.
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
import { ComplianceRecord } from "../models";

const TABLE = TABLES.COMPLIANCE;

export async function getAllCompliance(
  userId: string,
): Promise<ComplianceRecord[]> {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    }),
  );
  return (res.Items || []) as ComplianceRecord[];
}

export async function createCompliance(
  userId: string,
  data: Partial<ComplianceRecord>,
): Promise<ComplianceRecord> {
  const item: ComplianceRecord = {
    userId,
    id: uuid(),
    title: data.title!,
    description: data.description!,
    dueDate: data.dueDate!,
    lastAudit: data.lastAudit || null,
    status: data.status || "Pending",
    createdAt: new Date().toISOString(),
  };

  await db.send(new PutCommand({ TableName: TABLE, Item: item }));
  return item;
}

export async function updateCompliance(
  id: string,
  userId: string,
  data: Partial<ComplianceRecord>,
): Promise<Record<string, unknown>> {
  const existing = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId, id } }),
  );
  if (!existing.Item) throw new Error("Not found");

  const res = await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId, id },
      UpdateExpression:
        "SET title = :t, description = :d, dueDate = :du, #s = :s, lastAudit = :la",
      ExpressionAttributeNames: { "#s": "status" }, // 'status' is a reserved word
      ExpressionAttributeValues: {
        ":t": data.title,
        ":d": data.description,
        ":du": data.dueDate,
        ":s": data.status,
        ":la": data.lastAudit ?? null,
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  return res.Attributes as Record<string, unknown>;
}

export async function deleteCompliance(
  id: string,
  userId: string,
): Promise<void> {
  const existing = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId, id } }),
  );
  if (!existing.Item) throw new Error("Not found");

  await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId, id } }));
}
