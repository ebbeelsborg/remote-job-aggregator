import { db } from "./db";
import { log } from "./log";
import { jobs, fetchLogs, settings, type InsertJob, type Job, type InsertFetchLog, type FetchLog, type Settings, type InsertSettings } from "@shared/schema";
import { eq, sql, desc, ilike, or, and, inArray, count } from "drizzle-orm";

const ALLOWED_LOCATION_TYPES = ["Anywhere", "Worldwide", "Global", "Remote", "Remote (APAC)"];

export interface IStorage {
  getJobs(params: {
    page: number;
    limit: number;
    search?: string;
    level?: string;
    companies?: string[];
  }): Promise<{ jobs: Job[]; total: number }>;
  getJobByExternalId(externalId: string, source: string): Promise<Job | undefined>;
  insertJob(job: InsertJob): Promise<Job>;
  insertJobs(jobsList: InsertJob[]): Promise<number>;
  getCompanies(): Promise<string[]>;
  getStats(): Promise<{
    totalJobs: number;
    totalCompanies: number;
    totalSources: number;
    byLevel: { level: string; count: number }[];
    bySource: { source: string; count: number }[];
    byLocationType: { locationType: string; count: number }[];
    topCompanies: { company: string; count: number }[];
    recentFetches: FetchLog[];
  }>;
  insertFetchLog(log: InsertFetchLog): Promise<FetchLog>;
  getSettings(): Promise<Settings>;
  updateSettings(id: number, settings: Partial<InsertSettings>): Promise<Settings>;
}

export class DatabaseStorage implements IStorage {
  async getJobs(params: {
    page: number;
    limit: number;
    search?: string;
    level?: string;
    companies?: string[];
  }): Promise<{ jobs: Job[]; total: number }> {
    const { page, limit, search, level, companies } = params;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(jobs.title, searchPattern),
          ilike(jobs.company, searchPattern),
          sql`EXISTS (SELECT 1 FROM unnest(${jobs.techTags}) AS tag WHERE tag ILIKE ${searchPattern})`
        )
      );
    }

    if (level) {
      conditions.push(ilike(jobs.level, `%${level}%`));
    }

    if (companies && companies.length > 0) {
      conditions.push(inArray(jobs.company, companies));
    }

    const whereClause = and(
      inArray(jobs.locationType, ALLOWED_LOCATION_TYPES),
      ...(conditions.length > 0 ? conditions : [])
    );

    const [totalResult] = await db
      .select({ count: count() })
      .from(jobs)
      .where(whereClause);

    const jobsList = await db
      .select()
      .from(jobs)
      .where(whereClause)
      .orderBy(desc(jobs.postedDate), desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);

    return { jobs: jobsList, total: totalResult.count };
  }

  async getJobByExternalId(externalId: string, source: string): Promise<Job | undefined> {
    const [job] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.externalId, externalId), eq(jobs.source, source)))
      .limit(1);
    return job;
  }

  async insertJob(job: InsertJob): Promise<Job> {
    const [inserted] = await db.insert(jobs).values(job).returning();
    return inserted;
  }

  async insertJobs(jobsList: InsertJob[]): Promise<number> {
    if (jobsList.length === 0) return 0;
    let added = 0;
    for (const job of jobsList) {
      const existing = await this.getJobByExternalId(job.externalId, job.source);
      if (!existing) {
        await this.insertJob(job);
        added++;
      }
    }
    return added;
  }

  async updateJobStatus(id: number, status: "applied" | "ignored" | null): Promise<Job> {
    const [updated] = await db
      .update(jobs)
      .set({ status })
      .where(eq(jobs.id, id))
      .returning();
    return updated;
  }

  async getCompanies(): Promise<string[]> {
    const result = await db
      .selectDistinct({ company: jobs.company })
      .from(jobs)
      .where(sql`${jobs.company} != 'Unknown'`)
      .orderBy(jobs.company);
    return result.map((r) => r.company);
  }

  async getStats() {
    const allowedFilter = inArray(jobs.locationType, ALLOWED_LOCATION_TYPES);

    const [totalResult] = await db.select({ count: count() }).from(jobs).where(allowedFilter);

    const companiesResult = await db
      .selectDistinct({ company: jobs.company })
      .from(jobs)
      .where(allowedFilter);

    const allSources = ["Remotive", "Himalayas", "Jobicy", "RemoteOK", "TheMuse", "WeWorkRemotely", "WorkingNomads", "DailyRemote"];

    const byLevelRaw = await db
      .select({
        level: sql<string>`COALESCE(${jobs.level}, 'Unspecified')`,
        count: count(),
      })
      .from(jobs)
      .where(allowedFilter)
      .groupBy(sql`COALESCE(${jobs.level}, 'Unspecified')`)
      .orderBy(desc(count()));

    const byLevel = byLevelRaw.map(r => ({ level: r.level, count: Number(r.count) }));

    const bySourceRaw = await db
      .select({
        source: jobs.source,
        count: count(),
      })
      .from(jobs)
      .where(allowedFilter)
      .groupBy(jobs.source)
      .orderBy(desc(count()));

    const bySource = bySourceRaw.map(r => ({ source: r.source, count: Number(r.count) }));

    const allowedLocationTypes = ["Anywhere", "Worldwide", "Global", "Remote", "Remote (APAC)"];
    const byLocationTypeRaw = await db
      .select({
        locationType: jobs.locationType,
        count: count(),
      })
      .from(jobs)
      .groupBy(jobs.locationType)
      .orderBy(desc(count()));

    const locationMap = new Map<string, number>();
    let otherRemoteCount = 0;

    for (const r of byLocationTypeRaw) {
      if (allowedLocationTypes.includes(r.locationType)) {
        locationMap.set(r.locationType, (locationMap.get(r.locationType) || 0) + Number(r.count));
      } else {
        // Any other location is treated as 'Remote' for aggregation purposes
        locationMap.set("Remote", (locationMap.get("Remote") || 0) + Number(r.count));
      }
    }

    const byLocationType = allowedLocationTypes.map((lt) => ({
      locationType: lt,
      count: locationMap.get(lt) ?? 0,
    })).sort((a, b) => b.count - a.count);

    const topCompaniesRaw = await db
      .select({
        company: jobs.company,
        count: count(),
      })
      .from(jobs)
      .where(and(sql`${jobs.company} != 'Unknown'`, allowedFilter))
      .groupBy(jobs.company)
      .orderBy(desc(count()))
      .limit(20);

    const topCompanies = topCompaniesRaw.map(r => ({ company: r.company, count: Number(r.count) }));

    const recentFetches = await db
      .select()
      .from(fetchLogs)
      .orderBy(desc(fetchLogs.fetchedAt))
      .limit(10);

    return {
      totalJobs: totalResult.count,
      totalCompanies: companiesResult.length,
      totalSources: allSources.length,
      byLevel: byLevel.map((r) => ({ level: r.level, count: r.count })),
      bySource: bySource.map((r) => ({ source: r.source, count: r.count })),
      byLocationType: byLocationType.map((r) => ({
        locationType: r.locationType,
        count: r.count,
      })),
      topCompanies: topCompanies.map((r) => ({
        company: r.company,
        count: r.count,
      })),
      recentFetches,
    };
  }

  async insertFetchLog(log: InsertFetchLog): Promise<FetchLog> {
    const [inserted] = await db.insert(fetchLogs).values(log).returning();
    return inserted;
  }

  async getSettings(): Promise<Settings> {
    try {
      // Self-healing: Ensure table exists
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS settings (
          id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          whitelisted_titles text[] NOT NULL DEFAULT '{"software", "engineer", "developer", "dev", "fullstack", "frontend", "backend", "swe", "sde", "sdet", "sre", "platform", "infrastructure", "infra", "mobile", "ios", "android", "cloud", "devops", "ai"}'::text[],
          harvesting_mode text NOT NULL DEFAULT 'fuzzy',
          updated_at timestamp NOT NULL DEFAULT NOW()
        );
      `);

      const [existing] = await db.select().from(settings).limit(1);
      if (existing) return existing;

      const [inserted] = await db.insert(settings).values({
        whitelistedTitles: ["software", "engineer", "developer", "dev", "fullstack", "frontend", "backend", "swe", "sde", "sdet", "sre", "platform", "infrastructure", "infra", "mobile", "ios", "android", "cloud", "devops", "ai"],
        harvestingMode: "fuzzy"
      }).returning();
      return inserted;
    } catch (err: any) {
      log(`Error in getSettings: ${err.message}`, "storage");
      throw err;
    }
  }

  async updateSettings(id: number, s: Partial<InsertSettings>): Promise<Settings> {
    const [updated] = await db
      .update(settings)
      .set({ ...s, updatedAt: new Date() })
      .where(eq(settings.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
