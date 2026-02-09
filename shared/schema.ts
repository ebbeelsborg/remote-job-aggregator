import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const jobs = pgTable("jobs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  externalId: text("external_id").notNull(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  companyLogo: text("company_logo"),
  locationType: text("location_type").notNull().default("remote"),
  level: text("level"),
  techTags: text("tech_tags").array().default(sql`'{}'::text[]`),
  url: text("url").notNull(),
  source: text("source").notNull(),
  salary: text("salary"),
  postedDate: timestamp("posted_date"),
  description: text("description"),
  jobType: text("job_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertJobSchema = createInsertSchema(jobs);
/* .omit({
  id: true,
  createdAt: true,
}); */

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export const fetchLogs = pgTable("fetch_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  source: text("source").notNull(),
  jobsFound: integer("jobs_found").notNull().default(0),
  jobsAdded: integer("jobs_added").notNull().default(0),
  success: boolean("success").notNull().default(true),
  error: text("error"),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
});

export const insertFetchLogSchema = z.object({
  source: z.string(),
  jobsFound: z.number().default(0),
  jobsAdded: z.number().default(0),
  success: z.boolean().default(true),
  error: z.string().optional().nullable(),
});

export type InsertFetchLog = z.infer<typeof insertFetchLogSchema>;
export type FetchLog = typeof fetchLogs.$inferSelect;

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  whitelistedTitles: text("whitelisted_titles").array(),
  harvestingMode: text("harvesting_mode"), // "exact" or "fuzzy"
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSettingsSchema = z.object({
  whitelistedTitles: z.array(z.string()).optional().nullable(),
  harvestingMode: z.string().optional().nullable(),
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
