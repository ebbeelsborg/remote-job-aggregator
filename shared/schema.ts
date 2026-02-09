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
  status: text("status"), // null, "applied", or "ignored"
  lifecycleStatus: text("lifecycle_status").default("new"), // "new", "active", or "inactive"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Manual schema definition to bypass drizzle-zod inference issues
export const insertJobSchema = z.object({
  externalId: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  companyLogo: z.string().optional().nullable(),
  locationType: z.string().default("remote"),
  level: z.string().optional().nullable(),
  techTags: z.array(z.string()).default([]),
  url: z.string().url(),
  source: z.string().min(1),
  salary: z.string().optional().nullable(),
  postedDate: z.coerce.date().optional().nullable(),
  description: z.string().optional().nullable(),
  jobType: z.string().optional().nullable(),
  status: z.enum(["applied", "ignored"]).optional().nullable(),
  lifecycleStatus: z.enum(["new", "active", "inactive"]).optional(),
});

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
  source: z.string().min(1),
  jobsFound: z.number().default(0),
  jobsAdded: z.number().default(0),
  success: z.boolean().default(true),
  error: z.string().optional().nullable(),
});

export type InsertFetchLog = z.infer<typeof insertFetchLogSchema>;
export type FetchLog = typeof fetchLogs.$inferSelect;

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  whitelistedTitles: text("whitelisted_titles").array().notNull().default(sql`'{"software", "engineer", "developer", "dev", "fullstack", "frontend", "backend", "swe", "sde", "sdet", "sre", "platform", "infrastructure", "infra", "mobile", "ios", "android", "cloud", "devops", "ai"}'::text[]`),
  harvestingMode: text("harvesting_mode").notNull().default("fuzzy"), // "exact" or "fuzzy"
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingsSchema = z.object({
  whitelistedTitles: z.array(z.string()).default([]),
  harvestingMode: z.string().default("fuzzy"),
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
