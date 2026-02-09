import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Briefcase,
  Building2,
  Globe,
  TrendingUp,
  Layers,
  Database,
  ExternalLink,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Stats {
  totalJobs: number;
  totalCompanies: number;
  totalSources: number;
  byLevel: { level: string; count: number }[];
  bySource: { source: string; count: number }[];
  byLocationType: { locationType: string; count: number }[];
  topCompanies: { company: string; count: number }[];
  recentFetches: { source: string; jobsAdded: number; fetchedAt: string }[];
}

const companyUrls: Record<string, string> = {
  "kyndryl": "https://www.kyndryl.com",
  "meta": "https://www.meta.com",
  "keeptruckin": "https://www.keeptruckin.com",
  "coinbase": "https://www.coinbase.com",
  "atlassian": "https://www.atlassian.com",
  "bluecore": "https://www.bluecore.com",
  "xai": "https://x.ai",
  "ubiminds": "https://www.ubiminds.com",
  "ensono": "https://www.ensono.com",
  "crowdstrike": "https://www.crowdstrike.com",
  "google": "https://www.google.com",
  "amazon": "https://www.amazon.com",
  "apple": "https://www.apple.com",
  "microsoft": "https://www.microsoft.com",
  "netflix": "https://www.netflix.com",
  "grafana labs": "https://grafana.com",
  "mongodb": "https://www.mongodb.com",
  "binance": "https://www.binance.com",
  "hubspot": "https://www.hubspot.com",
  "shiftkey": "https://www.shiftkey.com",
  "maven clinic": "https://www.mavenclinic.com",
  "roofr": "https://www.roofr.com",
  "esri": "https://www.esri.com",
  "apexver": "https://www.apexver.com",
  "telus digital": "https://www.telusdigital.com",
  "liberty mutual insurance": "https://www.libertymutual.com",
  "enterprise mobility": "https://www.enterprisemobility.com",
  "abbvie": "https://www.abbvie.com",
};

function getCompanyUrl(company: string): string {
  const lower = company.toLowerCase().trim();
  if (companyUrls[lower]) return companyUrls[lower];
  const cleaned = lower
    .replace(/\s*(inc\.?|llc\.?|ltd\.?|gmbh|corp\.?|co\.?|group|technologies|technology|solutions)\s*$/i, "")
    .trim();
  return `https://www.${cleaned.replace(/[^a-z0-9]+/g, "")}.com`;
}

const CHART_COLORS = [
  "hsl(217, 91%, 45%)",
  "hsl(142, 76%, 36%)",
  "hsl(271, 81%, 42%)",
  "hsl(32, 95%, 44%)",
  "hsl(340, 82%, 42%)",
  "hsl(200, 70%, 50%)",
  "hsl(60, 70%, 40%)",
  "hsl(180, 60%, 40%)",
];

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s/g, "-")}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-3 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card><CardContent className="pt-6"><Skeleton className="h-[250px]" /></CardContent></Card>
            <Card><CardContent className="pt-6"><Skeleton className="h-[250px]" /></CardContent></Card>
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg">No data yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Fetch jobs first to see dashboard stats
          </p>
        </div>
      </div>
    );
  }

  const levelData = stats.byLevel.map((l) => ({
    name: l.level || "Unspecified",
    value: l.count,
  }));

  const sourceData = stats.bySource.map((s) => ({
    name: s.source,
    value: s.count,
  }));

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total Jobs"
            value={stats.totalJobs}
            icon={Briefcase}
            description="Active remote listings"
          />
          <StatCard
            title="Companies"
            value={stats.totalCompanies}
            icon={Building2}
            description="Unique employers"
          />
          <StatCard
            title="Sources"
            value={stats.totalSources}
            icon={Globe}
            description="Job boards tracked"
          />
          <StatCard
            title="Senior+ Roles"
            value={
              stats.byLevel
                .filter((l) =>
                  ["senior", "staff", "principal", "lead"].includes(
                    (l.level || "").toLowerCase()
                  )
                )
                .reduce((a, b) => a + b.count, 0)
            }
            icon={TrendingUp}
            description="Senior, Staff & Principal"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Jobs by Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" fontSize={11} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      fontSize={11}
                      width={80}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {sourceData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Jobs by Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={levelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                      fontSize={10}
                    >
                      {levelData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Location Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.byLocationType.map((lt) => {
                  const pct = stats.totalJobs > 0
                    ? Math.round((lt.count / stats.totalJobs) * 100)
                    : 0;
                  return (
                    <div key={lt.locationType} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 min-w-[100px] justify-center">
                        {lt.locationType}
                      </Badge>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {lt.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Top Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.topCompanies.slice(0, 10).map((c, i) => (
                  <div key={c.company} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <a
                      href={getCompanyUrl(c.company)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs flex-1 truncate hover:underline text-foreground"
                      data-testid={`link-company-${i}`}
                    >
                      {c.company}
                      <ExternalLink className="inline-block ml-1 h-3 w-3 text-muted-foreground" />
                    </a>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {c.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}
