/**
 * teamsService.ts
 *
 * All DynamoDB operations for teams.
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
import { Team } from "../models";

const TABLE = TABLES.TEAMS;

export async function getAllTeams(userId: string): Promise<Team[]> {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    }),
  );
  return (res.Items || []) as Team[];
}

export async function createTeam(
  userId: string,
  data: Partial<Team>,
): Promise<Team> {
  const item: Team = {
    userId,
    id: uuid(),
    name: data.name!,
    lead: data.lead!,
    members: data.members || [],
    responsibilities: data.responsibilities || [],
    projectsActive: Number(data.projectsActive || 0),
  };

  await db.send(new PutCommand({ TableName: TABLE, Item: item }));
  return item;
}

export async function updateTeam(
  id: string,
  userId: string,
  data: Partial<Team>,
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
        "SET #name = :name, #lead = :lead, members = :members, responsibilities = :resp, projectsActive = :projects",
      ExpressionAttributeNames: {
        "#name": "name", // reserved word
        "#lead": "lead",
      },
      ExpressionAttributeValues: {
        ":name": data.name,
        ":lead": data.lead,
        ":members": data.members,
        ":resp": data.responsibilities,
        ":projects": Number(data.projectsActive),
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  return res.Attributes as Record<string, unknown>;
}

export async function deleteTeam(id: string, userId: string): Promise<void> {
  const existing = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId, id } }),
  );
  if (!existing.Item) throw new Error("Not found");

  await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId, id } }));
}
