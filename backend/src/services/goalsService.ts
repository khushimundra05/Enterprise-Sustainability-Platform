/**
 * goalsService.ts
 *
 * All DynamoDB operations for goals.
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
import { Goal, GoalStatus } from "../models";

const TABLE = TABLES.GOALS;

export async function getAllGoals(userId: string): Promise<Goal[]> {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    }),
  );
  return (res.Items || []) as Goal[];
}

export async function createGoal(
  userId: string,
  data: Partial<Goal>,
): Promise<Goal> {
  const item: Goal = {
    userId,
    id: uuid(),
    title: data.title!,
    category: data.category!,
    target: data.target!,
    unit: data.unit!,
    deadline: data.deadline!,
    progress: 0,
    status: "on-track",
    createdAt: new Date().toISOString(),
  };

  await db.send(new PutCommand({ TableName: TABLE, Item: item }));
  return item;
}

export async function updateGoal(
  id: string,
  userId: string,
  progress: number,
): Promise<void> {
  const existing = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId, id } }),
  );
  if (!existing.Item) throw new Error("Not found");

  // Derive status from progress vs target
  const target: number = existing.Item.target || 100;
  const ratio = progress / target;
  const status: GoalStatus =
    ratio >= 0.8 ? "on-track" : ratio >= 0.5 ? "at-risk" : "behind";

  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId, id },
      UpdateExpression: "SET progress = :p, #st = :s",
      ExpressionAttributeNames: { "#st": "status" }, // 'status' is reserved
      ExpressionAttributeValues: { ":p": progress, ":s": status },
    }),
  );
}

export async function deleteGoal(id: string, userId: string): Promise<void> {
  const existing = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId, id } }),
  );
  if (!existing.Item) throw new Error("Not found");

  await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId, id } }));
}
