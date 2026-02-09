import { db } from "./db";
import { sql } from "drizzle-orm";
import { log } from "./log";

export async function initDatabase() {
  try {
    log("Checking/creating settings table...", "db-init");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS settings (
        id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        whitelisted_titles text[] NOT NULL DEFAULT '{"software", "engineer", "developer", "dev", "fullstack", "frontend", "backend", "swe", "sde", "sdet", "sre", "platform", "infrastructure", "infra", "mobile", "ios", "android", "cloud", "devops", "ai"}'::text[],
        harvesting_mode text NOT NULL DEFAULT 'fuzzy',
        updated_at timestamp NOT NULL DEFAULT NOW()
      );
    `);
    log("Database initialization successful", "db-init");
  } catch (err: any) {
    console.error("CRITICAL DATABASE INIT ERROR:", err);
    log(`Database initialization failed: ${err.message}`, "db-init");
    // We don't throw here to allow the rest of the app to start (except the broken parts)
  }
}
