/**
 * energyService.ts
 *
 * Fixes applied:
 * - Uses shared `db` client from dynamo.ts (not its own DynamoDBClient)
 * - Uses TABLES from env.ts (not process.env directly)
 * - getAllEnergy uses QueryCommand (userId is partition key, id is sort key)
 * - deleteEnergy verifies ownership via GetCommand before deleting
 */
import {
  QueryCommand,
  PutCommand,
  DeleteCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { db } from "./dynamo";
import { TABLES } from "../utils/env";

export async function getAllEnergy(userId: string) {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLES.ENERGY,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    }),
  );
  return res.Items || [];
}

export async function createEnergy(userId: string, data: any) {
  const item = {
    userId, // partition key
    id: uuidv4(), // sort key
    source: data.source,
    facility: data.facility,
    consumption: data.consumption,
    cost: data.cost,
    date: data.date,
    createdAt: new Date().toISOString(),
  };

  await db.send(new PutCommand({ TableName: TABLES.ENERGY, Item: item }));
  return item;
}

export async function deleteEnergy(id: string, userId: string) {
  // Ownership check: if this userId+id combo doesn't exist, item belongs to another user
  const existing = await db.send(
    new GetCommand({
      TableName: TABLES.ENERGY,
      Key: { userId, id },
    }),
  );

  if (!existing.Item) {
    throw new Error("Not found");
  }

  await db.send(
    new DeleteCommand({
      TableName: TABLES.ENERGY,
      Key: { userId, id },
    }),
  );

  return { success: true };
}
