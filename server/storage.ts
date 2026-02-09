import { db } from "./db";
import { jobs, fetchLogs, type InsertJob, type Job, type InsertFetchLog, type FetchLog } from "@shared/schema";
import { eq, sql, desc, ilike, or, and, inArray, count } from "drizzle-orm";

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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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

  async getCompanies(): Promise<string[]> {
    const result = await db
      .selectDistinct({ company: jobs.company })
      .from(jobs)
      .where(sql`${jobs.company} != 'Unknown'`)
      .orderBy(jobs.company);
    return result.map((r) => r.company);
  }

  async getStats() {
    const [totalResult] = await db.select({ count: count() }).from(jobs);

    const companiesResult = await db
      .selectDistinct({ company: jobs.company })
      .from(jobs);

    const sourcesResult = await db
      .selectDistinct({ source: jobs.source })
      .from(jobs);

    const byLevel = await db
      .select({
        level: sql<string>`COALESCE(${jobs.level}, 'Unspecified')`,
        count: count(),
      })
      .from(jobs)
      .groupBy(sql`COALESCE(${jobs.level}, 'Unspecified')`)
      .orderBy(desc(count()));

    const bySource = await db
      .select({
        source: jobs.source,
        count: count(),
      })
      .from(jobs)
      .groupBy(jobs.source)
      .orderBy(desc(count()));

    const byLocationType = await db
      .select({
        locationType: jobs.locationType,
        count: count(),
      })
      .from(jobs)
      .groupBy(jobs.locationType)
      .orderBy(desc(count()));

    const topCompanies = await db
      .select({
        company: jobs.company,
        count: count(),
      })
      .from(jobs)
      .where(sql`${jobs.company} != 'Unknown'`)
      .groupBy(jobs.company)
      .orderBy(desc(count()))
      .limit(20);

    const recentFetches = await db
      .select()
      .from(fetchLogs)
      .orderBy(desc(fetchLogs.fetchedAt))
      .limit(10);

    return {
      totalJobs: totalResult.count,
      totalCompanies: companiesResult.length,
      totalSources: sourcesResult.length,
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
}

export const storage = new DatabaseStorage();
