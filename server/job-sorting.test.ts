import { describe, it, expect } from "vitest";

// Mock job data for testing sorting logic
interface MockJob {
  id: number;
  title: string;
  status: string | null;
  level: string | null;
  locationType: string;
  salary: string | null;
  postedDate: Date | null;
}

describe("Job Sorting Logic", () => {
  describe("Sort by Status (Applied)", () => {
    it("should prioritize jobs with 'applied' status", () => {
      const jobs: MockJob[] = [
        { id: 1, title: "Job 1", status: null, level: null, locationType: "Remote", salary: null, postedDate: null },
        { id: 2, title: "Job 2", status: "applied", level: null, locationType: "Remote", salary: null, postedDate: null },
        { id: 3, title: "Job 3", status: "ignored", level: null, locationType: "Remote", salary: null, postedDate: null },
        { id: 4, title: "Job 4", status: "applied", level: null, locationType: "Remote", salary: null, postedDate: null },
      ];

      const sorted = jobs.sort((a, b) => {
        const aScore = a.status === "applied" ? 0 : 1;
        const bScore = b.status === "applied" ? 0 : 1;
        return aScore - bScore;
      });

      expect(sorted[0].status).toBe("applied");
      expect(sorted[1].status).toBe("applied");
      expect(sorted[2].status).not.toBe("applied");
      expect(sorted[3].status).not.toBe("applied");
    });
  });

  describe("Sort by Status (Ignored)", () => {
    it("should prioritize jobs with 'ignored' status", () => {
      const jobs: MockJob[] = [
        { id: 1, title: "Job 1", status: null, level: null, locationType: "Remote", salary: null, postedDate: null },
        { id: 2, title: "Job 2", status: "ignored", level: null, locationType: "Remote", salary: null, postedDate: null },
        { id: 3, title: "Job 3", status: "applied", level: null, locationType: "Remote", salary: null, postedDate: null },
        { id: 4, title: "Job 4", status: "ignored", level: null, locationType: "Remote", salary: null, postedDate: null },
      ];

      const sorted = jobs.sort((a, b) => {
        const aScore = a.status === "ignored" ? 0 : 1;
        const bScore = b.status === "ignored" ? 0 : 1;
        return aScore - bScore;
      });

      expect(sorted[0].status).toBe("ignored");
      expect(sorted[1].status).toBe("ignored");
      expect(sorted[2].status).not.toBe("ignored");
      expect(sorted[3].status).not.toBe("ignored");
    });
  });

  describe("Sort by Level", () => {
    it("should order by seniority: Principal > Lead > Staff > Senior", () => {
      const jobs: MockJob[] = [
        { id: 1, title: "Senior Engineer", status: null, level: "Senior", locationType: "Remote", salary: null, postedDate: null },
        { id: 2, title: "Principal Engineer", status: null, level: "Principal", locationType: "Remote", salary: null, postedDate: null },
        { id: 3, title: "Staff Engineer", status: null, level: "Staff", locationType: "Remote", salary: null, postedDate: null },
        { id: 4, title: "Lead Engineer", status: null, level: "Lead", locationType: "Remote", salary: null, postedDate: null },
      ];

      const getLevelScore = (level: string | null): number => {
        if (!level) return 8;
        const lower = level.toLowerCase();
        if (lower.includes("principal")) return 1;
        if (lower.includes("lead")) return 2;
        if (lower.includes("staff")) return 3;
        if (lower.includes("senior") || lower.includes("sr")) return 4;
        if (lower.includes("mid")) return 5;
        if (lower.includes("junior") || lower.includes("jr")) return 6;
        if (lower.includes("intern")) return 7;
        return 8;
      };

      const sorted = jobs.sort((a, b) => getLevelScore(a.level) - getLevelScore(b.level));

      expect(sorted[0].level).toBe("Principal");
      expect(sorted[1].level).toBe("Lead");
      expect(sorted[2].level).toBe("Staff");
      expect(sorted[3].level).toBe("Senior");
    });
  });

  describe("Sort by Location Type", () => {
    it("should sort alphabetically by location type", () => {
      const jobs: MockJob[] = [
        { id: 1, title: "Job 1", status: null, level: null, locationType: "Worldwide", salary: null, postedDate: null },
        { id: 2, title: "Job 2", status: null, level: null, locationType: "Anywhere", salary: null, postedDate: null },
        { id: 3, title: "Job 3", status: null, level: null, locationType: "Remote", salary: null, postedDate: null },
        { id: 4, title: "Job 4", status: null, level: null, locationType: "Global", salary: null, postedDate: null },
      ];

      const sorted = jobs.sort((a, b) => a.locationType.localeCompare(b.locationType));

      expect(sorted[0].locationType).toBe("Anywhere");
      expect(sorted[1].locationType).toBe("Global");
      expect(sorted[2].locationType).toBe("Remote");
      expect(sorted[3].locationType).toBe("Worldwide");
    });
  });

  describe("Sort by Date", () => {
    it("should sort by postedDate descending (most recent first)", () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const jobs: MockJob[] = [
        { id: 1, title: "Old Job", status: null, level: null, locationType: "Remote", salary: null, postedDate: twoDaysAgo },
        { id: 2, title: "Recent Job", status: null, level: null, locationType: "Remote", salary: null, postedDate: now },
        { id: 3, title: "Yesterday Job", status: null, level: null, locationType: "Remote", salary: null, postedDate: yesterday },
      ];

      const sorted = jobs.sort((a, b) => {
        const aTime = a.postedDate?.getTime() || 0;
        const bTime = b.postedDate?.getTime() || 0;
        return bTime - aTime; // Descending
      });

      expect(sorted[0].title).toBe("Recent Job");
      expect(sorted[1].title).toBe("Yesterday Job");
      expect(sorted[2].title).toBe("Old Job");
    });
  });

  describe("Sort by Pay", () => {
    it("should extract and sort by highest salary value", () => {
      const jobs: MockJob[] = [
        { id: 1, title: "Job 1", status: null, level: null, locationType: "Remote", salary: "$100k-$150k", postedDate: null },
        { id: 2, title: "Job 2", status: null, level: null, locationType: "Remote", salary: "$200k-$250k", postedDate: null },
        { id: 3, title: "Job 3", status: null, level: null, locationType: "Remote", salary: null, postedDate: null },
        { id: 4, title: "Job 4", status: null, level: null, locationType: "Remote", salary: "$150k-$180k", postedDate: null },
      ];

      const extractMaxSalary = (salary: string | null): number => {
        if (!salary) return 0;
        const match = salary.match(/\$?(\d+)k?-\$?(\d+)k?/);
        if (match) {
          return parseInt(match[2]) * 1000;
        }
        return 0;
      };

      const sorted = jobs.sort((a, b) => extractMaxSalary(b.salary) - extractMaxSalary(a.salary));

      expect(sorted[0].salary).toBe("$200k-$250k");
      expect(sorted[1].salary).toBe("$150k-$180k");
      expect(sorted[2].salary).toBe("$100k-$150k");
      expect(sorted[3].salary).toBe(null);
    });
  });
});
