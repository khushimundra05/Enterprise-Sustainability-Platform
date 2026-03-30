/**
 * scripts/recreate-tables.ts
 *
 * One-time migration: drops all existing tables and recreates them
 * with the correct key schema: userId (HASH) + id (RANGE).
 *
 * Run ONCE before Cognito testing:
 *   npx ts-node scripts/recreate-tables.ts
 *
 * Prerequisites:
 *   - AWS credentials configured (via .env or AWS CLI)
 *   - Tables are empty / only test data (confirmed safe to drop)
 */

import {
  DynamoDBClient,
  DeleteTableCommand,
  CreateTableCommand,
  waitUntilTableNotExists,
  waitUntilTableExists,
  ListTablesCommand,
} from "@aws-sdk/client-dynamodb";
import * as dotenv from "dotenv";

dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

const TABLES: { name: string; envKey: string }[] = [
  {
    name: process.env.EMISSIONS_TABLE || "emissions",
    envKey: "EMISSIONS_TABLE",
  },
  { name: process.env.ENERGY_TABLE || "EnergyTable", envKey: "ENERGY_TABLE" },
  { name: process.env.WATER_TABLE || "WaterTable", envKey: "WATER_TABLE" },
  { name: process.env.WASTE_TABLE || "WasteTable", envKey: "WASTE_TABLE" },
  {
    name: process.env.SUPPLIERS_TABLE || "SuppliersTable",
    envKey: "SUPPLIERS_TABLE",
  },
  {
    name: process.env.COMPLIANCE_TABLE || "ComplianceTable",
    envKey: "COMPLIANCE_TABLE",
  },
  { name: process.env.GOALS_TABLE || "GoalsTable", envKey: "GOALS_TABLE" },
  { name: process.env.TEAMS_TABLE || "TeamsTable", envKey: "TEAMS_TABLE" },
  {
    name: process.env.REPORTS_TABLE || "ReportsTable",
    envKey: "REPORTS_TABLE",
  },
];

async function getExistingTables(): Promise<string[]> {
  const res = await client.send(new ListTablesCommand({}));
  return res.TableNames || [];
}

async function dropTable(tableName: string): Promise<void> {
  try {
    await client.send(new DeleteTableCommand({ TableName: tableName }));
    console.log(`  ⏳ Deleting ${tableName}...`);
    await waitUntilTableNotExists(
      { client, maxWaitTime: 60 },
      { TableName: tableName },
    );
    console.log(`  ✅ Deleted ${tableName}`);
  } catch (err: any) {
    if (err.name === "ResourceNotFoundException") {
      console.log(`  ℹ️  ${tableName} doesn't exist, skipping delete`);
    } else {
      throw err;
    }
  }
}

async function createTable(tableName: string): Promise<void> {
  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "id", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "userId", KeyType: "HASH" },
        { AttributeName: "id", KeyType: "RANGE" },
      ],
      BillingMode: "PAY_PER_REQUEST",
    }),
  );

  console.log(`  ⏳ Creating ${tableName}...`);
  await waitUntilTableExists(
    { client, maxWaitTime: 60 },
    { TableName: tableName },
  );
  console.log(`  ✅ Created ${tableName} [userId (HASH) + id (RANGE)]`);
}

async function main() {
  console.log("\n🔍 Checking existing tables...");
  const existing = await getExistingTables();
  console.log(`   Found: ${existing.join(", ") || "none"}\n`);

  for (const table of TABLES) {
    console.log(`\n📋 Processing: ${table.name}`);

    if (existing.includes(table.name)) {
      await dropTable(table.name);
    }

    await createTable(table.name);
  }

  console.log("\n🎉 All tables recreated with correct schema.\n");
  console.log("Key schema for every table:");
  console.log("  Partition key (HASH): userId  — Cognito sub");
  console.log("  Sort key     (RANGE): id      — UUID\n");
  console.log("You can now start testing Cognito isolation:\n");
  console.log("  npx serverless offline --httpPort 4000\n");
}

main().catch((err) => {
  console.error("\n❌ Migration failed:", err);
  process.exit(1);
});
