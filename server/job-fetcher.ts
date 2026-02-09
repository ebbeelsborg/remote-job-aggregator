import { type InsertJob } from "@shared/schema";
import { storage } from "./storage";
import { log } from "./log";
import * as cheerio from "cheerio";

const ALLOWED_LOCATION_TYPES = ["Anywhere", "Worldwide", "Global", "Remote", "Remote (APAC)"] as const;

function normalizeLocationType(raw: string): string | null {
  if (!raw) return "Remote";
  const lower = raw.toLowerCase().trim();
  if (lower.includes("anywhere")) return "Anywhere";
  if (lower.includes("worldwide") || lower === "world") return "Worldwide";
  if (lower.includes("global")) return "Global";
  if (lower.includes("apac") || lower.includes("asia")) return "Remote (APAC)";
  if (lower.includes("remote")) return "Remote";
  if (lower === "") return "Remote";
  return null;
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

export function isJobWhitelisted(title: string, settings: { whitelistedTitles: string[], harvestingMode: string }): boolean {
  const t = title.toLowerCase().trim();

  if (settings.harvestingMode === "exact") {
    return settings.whitelistedTitles.some(w => t === w.toLowerCase().trim());
  } else {
    // Fuzzy matching using word boundaries
    const hasWord = (text: string, word: string) => {
      const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return re.test(text);
    };
    return settings.whitelistedTitles.some(w => hasWord(t, w.toLowerCase().trim()));
  }
}

function descriptionIndicatesSoftware(description?: string | null): boolean {
  if (!description || description.trim().length < 20) return false;
  const d = description.toLowerCase();

  const softwareIndicators = [
    "software", "code", "coding", "programming", "developer",
    "api", "frontend", "backend", "full-stack", "fullstack",
    "javascript", "typescript", "python", "java", "react",
    "node", "database", "cloud", "aws", "gcp", "azure",
    "microservices", "algorithms", "data structures", "git",
    "ci/cd", "devops", "kubernetes", "docker", "deploy",
    "web application", "mobile app", "saas", "machine learning",
    "deep learning", "neural network", "llm", "large language model",
    "codebase", "repository", "agile", "scrum", "sprint",
    "rest api", "graphql", "sdk", "framework",
  ];

  const civilIndicators = [
    "bridge", "highway", "construction", "structural",
    "concrete", "civil engineering", "building design",
    "surveying", "geotechnical", "transportation engineering",
    "water treatment", "plumbing", "hvac", "mechanical engineering",
    "electrical wiring", "power plant",
  ];

  const wordMatch = (text: string, word: string) => {
    const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return re.test(text);
  };
  const softwareScore = softwareIndicators.filter(w => wordMatch(d, w)).length;
  const civilScore = civilIndicators.filter(w => wordMatch(d, w)).length;

  if (civilScore > 0 && softwareScore === 0) return false;
  return softwareScore >= 2;
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

async function fetchRemotive(settings: any): Promise<InsertJob[]> {
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
    })).filter((j: any) => j.locationType !== null && isJobWhitelisted(j.title, settings)) as InsertJob[];
  } catch (err) {
    log(`Remotive fetch error: ${err}`, "fetcher");
    return [];
  }
}

async function fetchHimalayas(settings: any): Promise<InsertJob[]> {
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
        if (!isJobWhitelisted(title, settings)) continue;

        const locType = normalizeLocationType(
          Array.isArray(job.locationRestrictions) && job.locationRestrictions.length > 0
            ? job.locationRestrictions.join(", ")
            : "Worldwide"
        );
        if (!locType) continue;

        allJobs.push({
          externalId: String(job.id || job.slug || `him-${offset + allJobs.length}`),
          title,
          company: job.companyName || job.company_name || "Unknown",
          companyLogo: job.companyLogo || null,
          locationType: locType,
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

async function fetchJobicy(settings: any): Promise<InsertJob[]> {
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
    })).filter((j: any) => j.locationType !== null && isJobWhitelisted(j.title, settings)) as InsertJob[];
  } catch (err) {
    log(`Jobicy fetch error: ${err}`, "fetcher");
    return [];
  }
}

async function fetchRemoteOK(settings: any): Promise<InsertJob[]> {
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "Anywhere Jobs Aggregator" },
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
      })).filter((j: any) => j.locationType !== null && isJobWhitelisted(j.title, settings)) as InsertJob[];
  } catch (err) {
    log(`RemoteOK fetch error: ${err}`, "fetcher");
    return [];
  }
}

async function fetchWeWorkRemotely(settings: any): Promise<InsertJob[]> {
  try {
    const res = await fetch("https://weworkremotely.com/categories/remote-programming-jobs.rss", {
      headers: { "User-Agent": "Anywhere Jobs Aggregator" },
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

      const locType = normalizeLocationType(region || "Anywhere");
      if (!locType) return;

      const descText = cheerio.load(description).text();

      const companyMatch = title.match(/^(.+?):\s+(.+)$/);
      const company = companyMatch ? companyMatch[1].trim() : "Unknown";
      const jobTitle = companyMatch ? companyMatch[2].trim() : title;

      if (!isJobWhitelisted(jobTitle, settings)) return;

      jobs.push({
        externalId: `wwr-${Buffer.from(link).toString("base64").substring(0, 40)}`,
        title: jobTitle,
        company,
        companyLogo: null,
        locationType: locType,
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

async function fetchWorkingNomads(settings: any): Promise<InsertJob[]> {
  try {
    const res = await fetch("https://www.workingnomads.com/api/exposed_jobs/?category=development", {
      headers: { "User-Agent": "Anywhere Jobs Aggregator" },
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
      }).filter((j: any) => j.locationType !== null && isJobWhitelisted(j.title, settings)) as InsertJob[];
  } catch (err) {
    log(`WorkingNomads fetch error: ${err}`, "fetcher");
    return [];
  }
}

async function fetchDailyRemote(settings: any): Promise<InsertJob[]> {
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

    interface DailyRemotePartial {
      href: string;
      title: string;
      listingCompany: string;
      locationType: string | null;
      salary: string | null;
      tagTexts: string[];
    }

    const partials: DailyRemotePartial[] = [];
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

      let listingCompany = "Unknown";
      const $companyDiv = $article.find("div.company-name").first();
      const skipWords = /^(full time|part time|internship|contract|·|\d+ (?:min|hour|day|week|month)s? ago|\d+ \w+ ago)$/i;
      $companyDiv.find("span").each((_, spanEl) => {
        if (listingCompany !== "Unknown") return;
        const spanText = $(spanEl).text().trim();
        if (spanText && spanText.length > 1 && spanText.length < 80 && !skipWords.test(spanText) && spanText !== "·") {
          listingCompany = spanText;
        }
      });
      if (listingCompany === "Unknown") {
        const $mobileName = $article.find("div.company-name-mobile span").first();
        const mobileText = $mobileName.text().trim();
        if (mobileText && mobileText.length > 1 && !skipWords.test(mobileText)) {
          listingCompany = mobileText;
        }
      }

      const $meta = $article.find("div.job-meta").first();

      let locationType: string | null = "Remote";
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

      const $tags = $article.find("a[href*='/remote-'][href*='-jobs']");
      const tagTexts: string[] = [];
      $tags.each((_, tagEl) => {
        const tag = $(tagEl).text().trim();
        if (tag && !tag.includes("Software Development") && tag.length < 30) {
          tagTexts.push(tag);
        }
      });

      partials.push({ href, title, listingCompany, locationType, salary, tagTexts });
    });

    const limited = partials.slice(0, 100);

    const fetchCompanyFromDetailPage = async (href: string): Promise<string | null> => {
      try {
        const detailRes = await fetch(`https://dailyremote.com${href}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html",
          },
        });
        if (!detailRes.ok) return null;
        const detailHtml = await detailRes.text();
        const orgMatch = detailHtml.match(/"hiringOrganization"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/);
        if (orgMatch && orgMatch[1] && orgMatch[1] !== "[Hidden Company]") {
          return orgMatch[1];
        }
        return null;
      } catch {
        return null;
      }
    }

    const needsCompany = limited.filter(p => p.listingCompany === "Unknown");
    const batchSize = 5;
    const companyMap = new Map<string, string>();
    for (let i = 0; i < needsCompany.length; i += batchSize) {
      const batch = needsCompany.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(p => fetchCompanyFromDetailPage(p.href)));
      batch.forEach((p, idx) => {
        if (results[idx]) companyMap.set(p.href, results[idx]!);
      });
    }

    const jobs: InsertJob[] = limited
      .filter(p => p.locationType !== null && isJobWhitelisted(p.title, settings))
      .map(p => {
        const company = p.listingCompany !== "Unknown" ? p.listingCompany : (companyMap.get(p.href) || "Unknown");
        return {
          externalId: `dr-${Buffer.from(p.href).toString("base64").substring(0, 40)}`,
          title: p.title,
          company,
          companyLogo: null,
          locationType: p.locationType!,
          level: normalizeLevel(null, p.title),
          techTags: p.tagTexts.length > 0 ? p.tagTexts.slice(0, 6) : extractTechTags(p.title, ""),
          url: `https://dailyremote.com${p.href}`,
          source: "DailyRemote",
          salary: p.salary,
          postedDate: null,
          description: null,
          jobType: null,
        };
      });

    return jobs;
  } catch (err) {
    log(`DailyRemote fetch error: ${err}`, "fetcher");
    return [];
  }
}

async function fetchTheMuse(settings: any): Promise<InsertJob[]> {
  try {
    const allJobs: InsertJob[] = [];
    const maxPages = 5;

    for (let page = 1; page <= maxPages; page++) {
      const res = await fetch(
        `https://www.themuse.com/api/public/jobs?page=${page}&category=Software%20Engineering&location=Flexible%20%2F%20Remote`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
          },
        }
      );
      if (!res.ok) {
        log(`TheMuse page ${page} error: ${res.status}`, "fetcher");
        break;
      }
      const data = await res.json() as {
        results: Array<{
          id: number;
          name: string;
          company: { name: string } | string;
          levels: Array<{ name: string }>;
          locations: Array<{ name: string }>;
          publication_date: string;
          refs: { landing_page: string };
          contents: string;
          categories: Array<{ name: string }>;
        }>;
        page_count: number;
      };

      if (!data.results || data.results.length === 0) break;

      for (const job of data.results) {
        const title = job.name || "";
        if (!title || title.length < 3) continue;

        const description = job.contents || "";
        if (!isJobWhitelisted(title, settings)) continue;

        const company = typeof job.company === "string" ? job.company : job.company?.name || "Unknown";
        const url = job.refs?.landing_page || `https://www.themuse.com/jobs/${job.id}`;

        let level: string | null = null;
        if (job.levels && job.levels.length > 0) {
          const museLevel = job.levels[0].name;
          if (/senior/i.test(museLevel)) level = "Senior";
          else if (/mid/i.test(museLevel)) level = "Mid";
          else if (/entry|junior|intern/i.test(museLevel)) level = "Junior";
          else if (/management|director|vp/i.test(museLevel)) level = "Lead";
        }
        if (!level) level = normalizeLevel(null, title);

        const locations = job.locations?.map(l => l.name) || [];
        let locationType = "Remote";
        if (locations.some(l => /flexible|remote/i.test(l))) {
          locationType = "Worldwide";
        }

        const techTags = extractTechTags(title, description);

        allJobs.push({
          externalId: `muse-${job.id}`,
          title,
          company,
          companyLogo: null,
          locationType,
          level,
          techTags: techTags.slice(0, 6),
          url,
          source: "TheMuse",
          salary: null,
          postedDate: job.publication_date ? new Date(job.publication_date) : null,
          description: null,
          jobType: null,
        });
      }

      if (page >= data.page_count) break;
    }

    return allJobs;
  } catch (err) {
    log(`TheMuse fetch error: ${err}`, "fetcher");
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
  const settings = await storage.getSettings();

  const fetchers: { name: string; fn: (settings: any) => Promise<InsertJob[]> }[] = [
    { name: "Remotive", fn: fetchRemotive },
    { name: "Himalayas", fn: fetchHimalayas },
    { name: "Jobicy", fn: fetchJobicy },
    { name: "RemoteOK", fn: fetchRemoteOK },
    { name: "WeWorkRemotely", fn: fetchWeWorkRemotely },
    { name: "WorkingNomads", fn: fetchWorkingNomads },
    { name: "DailyRemote", fn: fetchDailyRemote },
    { name: "TheMuse", fn: fetchTheMuse },
  ];

  const results: FetchResult[] = [];
  let totalAdded = 0;

  for (const fetcher of fetchers) {
    try {
      log(`Fetching from ${fetcher.name}...`, "fetcher");
      const fetchedJobs = await fetcher.fn(settings);

      // Get existing jobs from this source
      const existingJobs = await storage.getJobsBySource(fetcher.name);
      const existingJobIds = new Set(existingJobs.map((j: any) => j.externalId));
      const fetchedJobIds = new Set(fetchedJobs.map((j: any) => j.externalId));

      // Insert new jobs (will be marked as "new" by default)
      const added = await storage.insertJobs(fetchedJobs);
      totalAdded += added;

      // Mark jobs that are still in the fetch as "active"
      const stillActiveJobs = existingJobs.filter((j: any) => fetchedJobIds.has(j.externalId));
      const stillActiveIds = stillActiveJobs.map((j: any) => j.id);
      if (stillActiveIds.length > 0) {
        await storage.updateJobsLifecycleStatusBulk(stillActiveIds, "active");
      }

      // Mark jobs that are no longer in the fetch as "inactive"
      const inactiveJobs = existingJobs.filter((j: any) => !fetchedJobIds.has(j.externalId));
      const inactiveIds = inactiveJobs.map((j: any) => j.id);
      if (inactiveIds.length > 0) {
        await storage.updateJobsLifecycleStatusBulk(inactiveIds, "inactive");
      }

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

      log(`${fetcher.name}: found ${fetchedJobs.length}, added ${added} new, marked ${inactiveIds.length} inactive`, "fetcher");
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
