/**
 * emissionsService.ts
 *
 * All DynamoDB operations for emissions.
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
import { Emission } from "../models";

const TABLE = TABLES.EMISSIONS;

export async function getAllEmissions(userId: string): Promise<Emission[]> {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    }),
  );
  return (res.Items || []) as Emission[];
}

export async function createEmission(
  userId: string,
  data: Partial<Emission>,
): Promise<Emission> {
  const item: Emission = {
    userId,
    id: uuid(),
    source: data.source!,
    amount: data.amount!,
    date: data.date!,
    facility: data.facility,
    notes: data.notes,
    createdAt: new Date().toISOString(),
  };

  await db.send(new PutCommand({ TableName: TABLE, Item: item }));
  return item;
}

export async function deleteEmission(
  id: string,
  userId: string,
): Promise<void> {
  const existing = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId, id } }),
  );
  if (!existing.Item) throw new Error("Not found");

  await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId, id } }));
}
