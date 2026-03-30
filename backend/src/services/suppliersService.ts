/**
 * suppliersService.ts
 *
 * All DynamoDB operations for suppliers.
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
import { Supplier } from "../models";

const TABLE = TABLES.SUPPLIERS;

export async function getAllSuppliers(userId: string): Promise<Supplier[]> {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    }),
  );
  return (res.Items || []) as Supplier[];
}

export async function createSupplier(
  userId: string,
  data: Partial<Supplier>,
): Promise<Supplier> {
  const item: Supplier = {
    userId,
    id: uuid(),
    name: data.name!,
    category: data.category!,
    location: data.location || "",
    carbonFootprint: data.carbonFootprint || 0,
    certifications: data.certifications || [],
    riskScore: data.riskScore || 0,
    lastAssessment: new Date().toISOString().slice(0, 10),
  };

  await db.send(new PutCommand({ TableName: TABLE, Item: item }));
  return item;
}

export async function assessSupplier(
  id: string,
  userId: string,
  riskScore: number,
): Promise<void> {
  // Ownership check
  const existing = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId, id } }),
  );
  if (!existing.Item) throw new Error("Not found");

  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId, id },
      UpdateExpression: "SET riskScore = :r, lastAssessment = :d",
      ExpressionAttributeValues: {
        ":r": riskScore,
        ":d": new Date().toISOString().slice(0, 10),
      },
    }),
  );
}

export async function deleteSupplier(
  id: string,
  userId: string,
): Promise<void> {
  const existing = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId, id } }),
  );
  if (!existing.Item) throw new Error("Not found");

  await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId, id } }));
}
