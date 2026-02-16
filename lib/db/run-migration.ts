// SPEC: Database migration runner
// Run with: npx tsx lib/db/run-migration.ts <migration-file>

import postgres from "postgres";
import { getDatabaseUrl } from "./client";
import { readFileSync } from "fs";
import { join } from "path";

async function runMigration(migrationFile: string) {
  const connectionString = getDatabaseUrl();
  const sql = postgres(connectionString, { max: 1 });

  try {
    const migrationPath = join(
      process.cwd(),
      "lib",
      "db",
      "migrations",
      migrationFile
    );
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    console.log(`Running migration: ${migrationFile}`);
    console.log("SQL:", migrationSQL);

    await sql.unsafe(migrationSQL);

    console.log("✅ Migration completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error("Usage: npx tsx lib/db/run-migration.ts <migration-file>");
  process.exit(1);
}

runMigration(migrationFile);
