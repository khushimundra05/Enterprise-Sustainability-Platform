/**
 * wasteService.ts
 *
 * All DynamoDB operations for waste records.
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
import { WasteRecord } from "../models";

const TABLE = TABLES.WASTE;

export async function getAllWaste(userId: string): Promise<WasteRecord[]> {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    }),
  );
  return (res.Items || []) as WasteRecord[];
}

export async function createWaste(
  userId: string,
  data: Partial<WasteRecord>,
): Promise<WasteRecord> {
  const item: WasteRecord = {
    userId,
    id: uuid(),
    date: data.date!,
    type: data.type!,
    facility: data.facility,
    amount: data.amount!,
    disposalMethod: data.disposalMethod,
    createdAt: new Date().toISOString(),
  };

  await db.send(new PutCommand({ TableName: TABLE, Item: item }));
  return item;
}

export async function deleteWaste(id: string, userId: string): Promise<void> {
  const existing = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId, id } }),
  );
  if (!existing.Item) throw new Error("Not found");

  await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId, id } }));
}
