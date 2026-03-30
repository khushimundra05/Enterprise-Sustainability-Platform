/**
 * waterService.ts
 *
 * All DynamoDB operations for water records.
 * Table key schema: userId (HASH) + id (RANGE)
 */
import {
  QueryCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { db } from "./dynamo";
import { TABLES } from "../utils/env";
import { WaterRecord } from "../models";

const TABLE = TABLES.WATER;

export async function getAllWater(userId: string): Promise<WaterRecord[]> {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    }),
  );
  return (res.Items || []) as WaterRecord[];
}

export async function createWater(
  userId: string,
  data: Partial<WaterRecord>,
): Promise<WaterRecord> {
  const item: WaterRecord = {
    userId,
    id: uuid(),
    source: data.source!,
    consumption: data.consumption!,
    date: data.date!,
    facility: data.facility,
    notes: data.notes,
    createdAt: new Date().toISOString(),
  };

  await db.send(new PutCommand({ TableName: TABLE, Item: item }));
  return item;
}

export async function deleteWater(id: string, userId: string): Promise<void> {
  const existing = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId, id } }),
  );
  if (!existing.Item) throw new Error("Not found");

  await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId, id } }));
}
