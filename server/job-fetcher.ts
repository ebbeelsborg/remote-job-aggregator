import { type InsertJob } from "@shared/schema";
import { storage } from "./storage";
import { log } from "./index";
import * as cheerio from "cheerio";

function normalizeLocationType(raw: string): string {
  if (!raw) return "Remote";
  const lower = raw.toLowerCase().trim();
  if (lower.includes("worldwide") || lower === "world") return "Worldwide";
  if (lower.includes("global")) return "Global";
  if (lower.includes("anywhere")) return "Anywhere";
  if (lower.includes("async")) return "Async";
  if (lower === "" || lower === "remote") return "Remote";

  const countryPatterns = [
    /^(us|usa|united states)/i,
    /^(uk|united kingdom|gb)/i,
    /^(eu|europe)/i,
    /^(canada|ca)/i,
    /^(australia|au)/i,
    /^(germany|de)/i,
    /^(france|fr)/i,
  ];
  for (const pattern of countryPatterns) {
    if (pattern.test(lower)) {
      return `Remote (${raw.trim()})`;
    }
  }

  if (lower.length > 2 && !lower.includes("office") && !lower.includes("onsite") && !lower.includes("on-site") && !lower.includes("hybrid")) {
    return `Remote (${raw.trim()})`;
  }

  return "Remote";
}

function detectLevel(title: string): string | null {
  const lower = title.toLowerCase();
  if (lower.includes("principal")) return "Principal";
  if (lower.includes("staff")) return "Staff";
  if (lower.includes("lead") || lower.includes("team lead")) return "Lead";
  if (lower.includes("senior") || lower.includes("sr.") || lower.includes("sr ")) return "Senior";
  if (lower.includes("junior") || lower.includes("jr.") || lower.includes("jr ")) return "Junior";
  if (lower.includes("mid-level") || lower.includes("mid level") || lower.includes("midweight")) return "Mid";
  if (lower.includes("intern")) return "Intern";
  if (lower.includes("director")) return "Director";
  if (lower.includes("manager")) return "Manager";
  return null;
}

function normalizeLevel(rawLevel: any, title: string): string | null {
  if (!rawLevel) return detectLevel(title);

  let str = "";
  if (Array.isArray(rawLevel)) {
    str = rawLevel.join(", ");
  } else if (typeof rawLevel === "object") {
    str = JSON.stringify(rawLevel);
  } else {
    str = String(rawLevel);
  }

  const cleaned = str.replace(/[{}"[\]]/g, "").trim();
  if (!cleaned) return detectLevel(title);
  const lower = cleaned.toLowerCase();

  if (lower.includes("principal")) return "Principal";
  if (lower.includes("staff")) return "Staff";
  if (lower.includes("lead")) return "Lead";
  if (lower.includes("senior") || lower.includes("sr")) return "Senior";
  if (lower.includes("mid") || lower.includes("midweight")) return "Mid";
  if (lower.includes("junior") || lower.includes("jr") || lower.includes("entry")) return "Junior";
  if (lower.includes("intern")) return "Intern";
  if (lower.includes("director")) return "Director";
  if (lower.includes("manager")) return "Manager";
  if (lower.includes("executive")) return "Executive";
  if (lower === "any" || lower === "") return detectLevel(title);

  return detectLevel(title) || cleaned;
}

function extractTechTags(title: string, description?: string | null): string[] {
  const text = `${title} ${description || ""}`.toLowerCase();
  const techKeywords: Record<string, string> = {
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "angular": "Angular",
    "vue": "Vue",
    "vuejs": "Vue",
    "vue.js": "Vue",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "python": "Python",
    "django": "Django",
    "flask": "Flask",
    "java ": "Java",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "golang": "Go",
    " go ": "Go",
    "rust": "Rust",
    "ruby": "Ruby",
    "rails": "Rails",
    "php": "PHP",
    "laravel": "Laravel",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "flutter": "Flutter",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "GCP",
    "terraform": "Terraform",
    "graphql": "GraphQL",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "elasticsearch": "Elasticsearch",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "svelte": "Svelte",
    "c++": "C++",
    "c#": "C#",
    ".net": ".NET",
    "scala": "Scala",
    "elixir": "Elixir",
    "machine learning": "ML",
    " ml ": "ML",
    " ai ": "AI",
    "data science": "Data Science",
    "devops": "DevOps",
    "ci/cd": "CI/CD",
    "linux": "Linux",
    "sql": "SQL",
  };

  const found = new Set<string>();
  for (const [keyword, label] of Object.entries(techKeywords)) {
    if (text.includes(keyword)) {
      found.add(label);
    }
  }
  return Array.from(found).slice(0, 6);
}

async function fetchRemotive(): Promise<InsertJob[]> {
  try {
    const res = await fetch("https://remotive.com/api/remote-jobs?category=software-dev&limit=100");
    if (!res.ok) throw new Error(`Remotive API error: ${res.status}`);
    const data = await res.json();

    return (data.jobs || []).map((job: any) => ({
      externalId: String(job.id),
      title: job.title,
      company: job.company_name,
      companyLogo: job.company_logo || null,
      locationType: normalizeLocationType(job.candidate_required_location || ""),
      level: normalizeLevel(null, job.title),
      techTags: extractTechTags(job.title, job.description),
      url: job.url,
      source: "Remotive",
      salary: job.salary || null,
      postedDate: job.publication_date ? new Date(job.publication_date) : null,
      description: job.description ? job.description.substring(0, 500) : null,
      jobType: job.job_type || null,
    }));
  } catch (err) {
    log(`Remotive fetch error: ${err}`, "fetcher");
    return [];
  }
}

async function fetchHimalayas(): Promise<InsertJob[]> {
  try {
    const allJobs: InsertJob[] = [];
    let offset = 0;
    const batchSize = 20;
    const maxBatches = 5;

    for (let batch = 0; batch < maxBatches; batch++) {
      const res = await fetch(`https://himalayas.app/jobs/api?limit=${batchSize}&offset=${offset}`);
      if (!res.ok) throw new Error(`Himalayas API error: ${res.status}`);
      const data = await res.json();
      const jobsList = Array.isArray(data) ? data : data.jobs || [];

      if (jobsList.length === 0) break;

      for (const job of jobsList) {
        const title = job.title || "";
        const categories = job.categories || [];
        const isTech = categories.some((c: string) =>
          /software|engineer|develop|programming|devops|data|tech|full.?stack|front.?end|back.?end|mobile|cloud|security|sre|platform/i.test(c)
        ) || /engineer|developer|programmer|devops|sre|architect|data|software|full.?stack|front.?end|back.?end|platform/i.test(title);

        if (!isTech) continue;

        allJobs.push({
          externalId: String(job.id || job.slug || `him-${offset + allJobs.length}`),
          title,
          company: job.companyName || job.company_name || "Unknown",
          companyLogo: job.companyLogo || null,
          locationType: normalizeLocationType(
            Array.isArray(job.locationRestrictions) && job.locationRestrictions.length > 0
              ? job.locationRestrictions.join(", ")
              : "Worldwide"
          ),
          level: normalizeLevel(job.seniority, title),
          techTags: extractTechTags(title, job.description),
          url: job.applicationLink || job.url || `https://himalayas.app/jobs/${job.slug || job.id}`,
          source: "Himalayas",
          salary: job.minSalary && job.maxSalary
            ? `$${Number(job.minSalary).toLocaleString()} - $${Number(job.maxSalary).toLocaleString()}`
            : null,
          postedDate: job.pubDate || job.postedDate ? new Date(job.pubDate || job.postedDate) : null,
          description: job.excerpt || (job.description ? job.description.substring(0, 500) : null),
          jobType: job.employmentType || null,
        });
      }

      offset += batchSize;
      await new Promise((r) => setTimeout(r, 500));
    }

    return allJobs;
  } catch (err) {
    log(`Himalayas fetch error: ${err}`, "fetcher");
    return [];
  }
}

async function fetchJobicy(): Promise<InsertJob[]> {
  try {
    const res = await fetch("https://jobicy.com/api/v2/remote-jobs?count=50&industry=dev");
    if (!res.ok) throw new Error(`Jobicy API error: ${res.status}`);
    const data = await res.json();

    return (data.jobs || []).map((job: any) => ({
      externalId: String(job.id),
      title: job.jobTitle,
      company: job.companyName,
      companyLogo: job.companyLogo || null,
      locationType: normalizeLocationType(job.jobGeo || ""),
      level: normalizeLevel(job.jobLevel, job.jobTitle),
      techTags: extractTechTags(job.jobTitle, job.jobDescription || job.jobExcerpt),
      url: job.url,
      source: "Jobicy",
      salary: job.annualSalaryMin && job.annualSalaryMax
        ? `$${Number(job.annualSalaryMin).toLocaleString()} - $${Number(job.annualSalaryMax).toLocaleString()}`
        : null,
      postedDate: job.pubDate ? new Date(job.pubDate) : null,
      description: job.jobExcerpt || null,
      jobType: job.jobType || null,
    }));
  } catch (err) {
    log(`Jobicy fetch error: ${err}`, "fetcher");
    return [];
  }
}

async function fetchRemoteOK(): Promise<InsertJob[]> {
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "RemoteHQ Job Aggregator" },
    });
    if (!res.ok) throw new Error(`RemoteOK API error: ${res.status}`);
    const data = await res.json();
    const jobsList = Array.isArray(data) ? data.slice(1) : [];

    return jobsList
      .filter((job: any) => job.position && job.company)
      .slice(0, 100)
      .map((job: any) => ({
        externalId: String(job.id),
        title: job.position,
        company: job.company,
        companyLogo: job.company_logo || job.logo || null,
        locationType: normalizeLocationType(job.location || ""),
        level: normalizeLevel(null, job.position),
        techTags: Array.isArray(job.tags) ? job.tags.slice(0, 6) : extractTechTags(job.position, job.description),
        url: job.url || `https://remoteok.com/remote-jobs/${job.id}`,
        source: "RemoteOK",
        salary: job.salary_min && job.salary_max
          ? `$${Number(job.salary_min).toLocaleString()} - $${Number(job.salary_max).toLocaleString()}`
          : null,
        postedDate: job.date ? new Date(job.date) : null,
        description: job.description ? job.description.substring(0, 500) : null,
        jobType: null,
      }));
  } catch (err) {
    log(`RemoteOK fetch error: ${err}`, "fetcher");
    return [];
  }
}

async function fetchWeWorkRemotely(): Promise<InsertJob[]> {
  try {
    const res = await fetch("https://weworkremotely.com/categories/remote-programming-jobs.rss", {
      headers: { "User-Agent": "RemoteHQ Job Aggregator" },
    });
    if (!res.ok) throw new Error(`WWR RSS error: ${res.status}`);
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    const jobs: InsertJob[] = [];
    $("item").each((_, el) => {
      const title = $(el).find("title").first().text().trim();
      const link = $(el).find("link").first().text().trim();
      const description = $(el).find("description").first().text() || "";
      const pubDate = $(el).find("pubDate").first().text().trim();
      const region = $(el).find("region").first().text().trim();

      if (!title || !link) return;

      const descText = cheerio.load(description).text();

      const companyMatch = title.match(/^(.+?):\s+(.+)$/);
      const company = companyMatch ? companyMatch[1].trim() : "Unknown";
      const jobTitle = companyMatch ? companyMatch[2].trim() : title;

      jobs.push({
        externalId: `wwr-${Buffer.from(link).toString("base64").substring(0, 40)}`,
        title: jobTitle,
        company,
        companyLogo: null,
        locationType: normalizeLocationType(region || "Anywhere"),
        level: normalizeLevel(null, jobTitle),
        techTags: extractTechTags(jobTitle, descText),
        url: link,
        source: "WeWorkRemotely",
        salary: null,
        postedDate: pubDate ? new Date(pubDate) : null,
        description: descText.substring(0, 500),
        jobType: null,
      });
    });

    return jobs.slice(0, 100);
  } catch (err) {
    log(`WeWorkRemotely fetch error: ${err}`, "fetcher");
    return [];
  }
}

async function fetchWorkingNomads(): Promise<InsertJob[]> {
  try {
    const res = await fetch("https://www.workingnomads.com/api/exposed_jobs/?category=development", {
      headers: { "User-Agent": "RemoteHQ Job Aggregator" },
    });
    if (!res.ok) throw new Error(`WorkingNomads API error: ${res.status}`);
    const data = await res.json();
    const jobsList = Array.isArray(data) ? data : [];

    return jobsList
      .filter((job: any) => job.title && job.url)
      .slice(0, 100)
      .map((job: any) => {
        const descText = job.description ? cheerio.load(job.description).text().substring(0, 500) : null;
        const tags = job.tags ? String(job.tags).split(",").map((t: string) => t.trim()).filter(Boolean) : [];

        return {
          externalId: `wn-${Buffer.from(job.url).toString("base64").substring(0, 40)}`,
          title: job.title,
          company: job.company_name || "Unknown",
          companyLogo: null,
          locationType: normalizeLocationType(job.location || ""),
          level: normalizeLevel(null, job.title),
          techTags: tags.length > 0 ? tags.slice(0, 6) : extractTechTags(job.title, descText || ""),
          url: job.url,
          source: "WorkingNomads",
          salary: null,
          postedDate: job.pub_date ? new Date(job.pub_date) : null,
          description: descText,
          jobType: null,
        };
      });
  } catch (err) {
    log(`WorkingNomads fetch error: ${err}`, "fetcher");
    return [];
  }
}

async function fetchDailyRemote(): Promise<InsertJob[]> {
  try {
    const res = await fetch("https://dailyremote.com/remote-software-development-jobs", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) throw new Error(`DailyRemote error: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const jobs: InsertJob[] = [];
    const seen = new Set<string>();

    $("article").each((_, el) => {
      const $article = $(el);

      const $titleLink = $article.find("h2.job-position a[href*='/remote-job/']").first();
      if (!$titleLink.length) return;

      const href = $titleLink.attr("href") || "";
      if (!href || seen.has(href)) return;
      seen.add(href);

      const title = $titleLink.text().trim();
      if (!title || title.length < 3) return;

      let company = "Unknown";
      const $companyDiv = $article.find("div.company-name").first();
      const skipWords = /^(full time|part time|internship|contract|·|\d+ (?:min|hour|day|week|month)s? ago|\d+ \w+ ago)$/i;
      $companyDiv.find("span").each((_, spanEl) => {
        if (company !== "Unknown") return;
        const spanText = $(spanEl).text().trim();
        if (spanText && spanText.length > 1 && spanText.length < 80 && !skipWords.test(spanText) && spanText !== "·") {
          company = spanText;
        }
      });
      if (company === "Unknown") {
        const $mobileName = $article.find("div.company-name-mobile span").first();
        const mobileText = $mobileName.text().trim();
        if (mobileText && mobileText.length > 1 && !skipWords.test(mobileText)) {
          company = mobileText;
        }
      }

      const $meta = $article.find("div.job-meta").first();

      let locationType = "Remote";
      const $cardTags = $meta.find("span.card-tag");
      $cardTags.each((_, tagEl) => {
        const tagText = $(tagEl).text().trim();
        if (tagText.startsWith("🌎")) {
          const loc = tagText.replace("🌎", "").trim();
          if (loc) locationType = normalizeLocationType(loc);
        }
      });

      let salary: string | null = null;
      $cardTags.each((_, tagEl) => {
        const tagText = $(tagEl).text().trim();
        if (tagText.includes("💵")) {
          const salaryClean = tagText.replace("💵", "").trim();
          if (salaryClean) salary = salaryClean;
        }
      });

      const url = `https://dailyremote.com${href}`;

      const $tags = $article.find("a[href*='/remote-'][href*='-jobs']");
      const tagTexts: string[] = [];
      $tags.each((_, tagEl) => {
        const tag = $(tagEl).text().trim();
        if (tag && !tag.includes("Software Development") && tag.length < 30) {
          tagTexts.push(tag);
        }
      });

      jobs.push({
        externalId: `dr-${Buffer.from(href).toString("base64").substring(0, 40)}`,
        title,
        company,
        companyLogo: null,
        locationType,
        level: normalizeLevel(null, title),
        techTags: tagTexts.length > 0 ? tagTexts.slice(0, 6) : extractTechTags(title, ""),
        url,
        source: "DailyRemote",
        salary,
        postedDate: null,
        description: null,
        jobType: null,
      });
    });

    return jobs.slice(0, 100);
  } catch (err) {
    log(`DailyRemote fetch error: ${err}`, "fetcher");
    return [];
  }
}

interface FetchResult {
  source: string;
  found: number;
  added: number;
  error?: string;
}

export async function fetchAllJobs(): Promise<{
  totalAdded: number;
  sources: FetchResult[];
}> {
  const fetchers = [
    { name: "Remotive", fn: fetchRemotive },
    { name: "Himalayas", fn: fetchHimalayas },
    { name: "Jobicy", fn: fetchJobicy },
    { name: "RemoteOK", fn: fetchRemoteOK },
    { name: "WeWorkRemotely", fn: fetchWeWorkRemotely },
    { name: "WorkingNomads", fn: fetchWorkingNomads },
    { name: "DailyRemote", fn: fetchDailyRemote },
  ];

  const results: FetchResult[] = [];
  let totalAdded = 0;

  for (const fetcher of fetchers) {
    try {
      log(`Fetching from ${fetcher.name}...`, "fetcher");
      const fetchedJobs = await fetcher.fn();
      const added = await storage.insertJobs(fetchedJobs);
      totalAdded += added;

      results.push({
        source: fetcher.name,
        found: fetchedJobs.length,
        added,
      });

      await storage.insertFetchLog({
        source: fetcher.name,
        jobsFound: fetchedJobs.length,
        jobsAdded: added,
        success: true,
        error: null,
      });

      log(`${fetcher.name}: found ${fetchedJobs.length}, added ${added} new`, "fetcher");
    } catch (err: any) {
      results.push({
        source: fetcher.name,
        found: 0,
        added: 0,
        error: err.message,
      });

      await storage.insertFetchLog({
        source: fetcher.name,
        jobsFound: 0,
        jobsAdded: 0,
        success: false,
        error: err.message,
      });

      log(`${fetcher.name} error: ${err.message}`, "fetcher");
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  return { totalAdded, sources: results };
}
