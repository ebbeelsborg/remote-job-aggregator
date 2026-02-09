import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Building2, DollarSign } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Job } from "@shared/schema";

const sourceUrls: Record<string, string> = {
  "Remotive": "https://remotive.com",
  "Himalayas": "https://himalayas.app",
  "Jobicy": "https://jobicy.com",
  "RemoteOK": "https://remoteok.com",
  "WeWorkRemotely": "https://weworkremotely.com",
  "WorkingNomads": "https://workingnomads.com",
  "DailyRemote": "https://dailyremote.com",
  "TheMuse": "https://www.themuse.com",
};

function getLocationBadgeVariant(locationType: string) {
  const lower = locationType.toLowerCase();
  if (lower.includes("worldwide") || lower.includes("global") || lower.includes("anywhere")) {
    return "default";
  }
  if (lower.includes("async")) {
    return "secondary";
  }
  return "outline";
}

function getLevelColor(level: string | null) {
  if (!level) return null;
  const lower = level.toLowerCase();
  if (lower.includes("principal")) return "bg-chart-3 text-white";
  if (lower.includes("staff")) return "bg-chart-4 text-white";
  if (lower.includes("senior") || lower.includes("sr")) return "bg-chart-1 text-white";
  if (lower.includes("lead")) return "bg-chart-5 text-white";
  return null;
}

function getCompanyInitials(name: string) {
  return name
    .split(/[\s&]+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const knownDomains: Record<string, string> = {
  "meta": "meta.com",
  "google": "google.com",
  "amazon": "amazon.com",
  "apple": "apple.com",
  "microsoft": "microsoft.com",
  "netflix": "netflix.com",
  "xai": "x.ai",
  "grafana labs": "grafana.com",
  "crowdstrike": "crowdstrike.com",
  "mongodb": "mongodb.com",
  "abbvie": "abbvie.com",
  "binance": "binance.com",
};

function getCompanyLogoUrl(company: string): string | null {
  if (!company || company === "Unknown") return null;
  const lower = company.toLowerCase().trim();
  let domain: string;
  if (knownDomains[lower]) {
    domain = knownDomains[lower];
  } else {
    const cleaned = lower
      .replace(/\s*(inc\.?|llc\.?|ltd\.?|gmbh|corp\.?|co\.?|group|technologies|technology|solutions)\s*$/i, "")
      .trim();
    domain = cleaned.replace(/[^a-z0-9]+/g, "") + ".com";
  }
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

function formatDate(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const levelColor = getLevelColor(job.level);
  const tags = (job.techTags || []).slice(0, 4);
  const logoUrl = job.companyLogo || getCompanyLogoUrl(job.company);

  return (
    <Card className="hover-elevate active-elevate-2 transition-all duration-200 group" data-testid={`card-job-${job.id}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 rounded-md flex-shrink-0">
            {logoUrl && (
              <AvatarImage src={logoUrl} alt={job.company} />
            )}
            <AvatarFallback className="rounded-md text-xs font-medium">
              {getCompanyInitials(job.company)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3
                  className="font-semibold text-sm leading-tight truncate"
                  title={job.title}
                  data-testid={`text-job-title-${job.id}`}
                >
                  {job.title}
                </h3>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground truncate" data-testid={`text-job-company-${job.id}`}>
                    {job.company}
                  </span>
                  {job.postedDate && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(job.postedDate)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
                data-testid={`link-job-${job.id}`}
              >
                <Button size="icon" variant="ghost">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            </div>

            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              <Badge variant={getLocationBadgeVariant(job.locationType)} className="text-[10px] px-1.5 py-0">
                <MapPin className="h-2.5 w-2.5 mr-0.5" />
                {job.locationType}
              </Badge>

              {job.level && levelColor && (
                <Badge className={`text-[10px] px-1.5 py-0 ${levelColor}`}>
                  {job.level}
                </Badge>
              )}

              {job.salary && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  <DollarSign className="h-2.5 w-2.5 mr-0.5" />
                  {job.salary}
                </Badge>
              )}
            </div>

            {tags.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-2.5">
              <a
                href={sourceUrls[job.source] || "#"}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`link-job-source-${job.id}`}
              >
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground cursor-pointer">
                  {job.source}
                </Badge>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
