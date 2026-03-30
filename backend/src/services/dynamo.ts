/**
 * dynamo.ts
 *
 * Shared DynamoDB document client.
 * Import `db` in every handler/service — do not create new clients per file.
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { REGION } from "../utils/env";

const raw = new DynamoDBClient({ region: REGION });

export const db = DynamoDBDocumentClient.from(raw, {
  marshallOptions: {
    removeUndefinedValues: true, // prevents errors when optional fields are missing
  },
});
