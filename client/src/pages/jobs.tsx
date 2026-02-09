import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { JobCard } from "@/components/job-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Building2,
  Briefcase,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { Job } from "@shared/schema";

interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  totalPages: number;
}

const LEVELS = ["Senior", "Staff", "Principal", "Lead"];

export default function JobsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [companySearch, setCompanySearch] = useState("");

  const { data: companiesData } = useQuery<string[]>({
    queryKey: ["/api/companies"],
  });

  const params = new URLSearchParams();
  params.set("page", page.toString());
  params.set("limit", "20");
  if (search) params.set("search", search);
  if (level && level !== "all") params.set("level", level);
  if (selectedCompanies.length > 0) params.set("companies", selectedCompanies.join(","));

  const queryUrl = `/api/jobs?${params.toString()}`;

  const { data, isLoading } = useQuery<JobsResponse>({
    queryKey: [queryUrl],
  });

  const companies = companiesData || [];
  const filteredCompanies = companies.filter((c) =>
    c.toLowerCase().includes(companySearch.toLowerCase())
  );

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setLevel("all");
    setSelectedCompanies([]);
    setPage(1);
  };

  const hasActiveFilters = search || (level && level !== "all") || selectedCompanies.length > 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 border-b bg-background">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs by title, company, or tech..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Button onClick={handleSearch} data-testid="button-search">
              Search
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Filters:</span>
            </div>

            <Select value={level} onValueChange={(v) => { setLevel(v); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-8 text-xs" data-testid="select-level">
                <Briefcase className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 text-xs gap-1.5" data-testid="button-company-filter">
                  <Building2 className="h-3 w-3" />
                  Companies
                  {selectedCompanies.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-1">
                      {selectedCompanies.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[260px] p-3" align="start">
                <Input
                  placeholder="Search companies..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="mb-2 h-8 text-xs"
                  data-testid="input-company-search"
                />
                <ScrollArea className="h-[200px]">
                  <div className="space-y-1">
                    {filteredCompanies.map((c) => (
                      <label
                        key={c}
                        className="flex items-center gap-2 py-1 px-1 rounded-md hover-elevate cursor-pointer text-xs"
                      >
                        <Checkbox
                          checked={selectedCompanies.includes(c)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCompanies([...selectedCompanies, c]);
                            } else {
                              setSelectedCompanies(selectedCompanies.filter((sc) => sc !== c));
                            }
                            setPage(1);
                          }}
                        />
                        <span className="truncate">{c}</span>
                      </label>
                    ))}
                    {filteredCompanies.length === 0 && (
                      <p className="text-xs text-muted-foreground py-4 text-center">No companies found</p>
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={clearFilters} data-testid="button-clear-filters">
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}

            {data && (
              <span className="text-xs text-muted-foreground ml-auto" data-testid="text-job-count">
                {data.total.toLocaleString()} jobs found
              </span>
            )}
          </div>

          {selectedCompanies.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {selectedCompanies.map((c) => (
                <Badge
                  key={c}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 gap-1 cursor-pointer"
                  onClick={() => {
                    setSelectedCompanies(selectedCompanies.filter((sc) => sc !== c));
                    setPage(1);
                  }}
                >
                  {c}
                  <X className="h-2.5 w-2.5" />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="p-4 h-full flex flex-col">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-md shrink-0" />
                  <div className="flex-1 space-y-2 overflow-hidden">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex gap-1">
                      <Skeleton className="h-4 w-16 rounded-full" />
                      <Skeleton className="h-4 w-12 rounded-full" />
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : data?.jobs.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No jobs found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {hasActiveFilters
                  ? "Try adjusting your filters or search terms"
                  : "Click \"Fetch Jobs Now\" in the sidebar to load remote job listings"}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            data?.jobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </div>
      </ScrollArea>

      {data && data.totalPages > 1 && (
        <div className="flex-shrink-0 border-t bg-background p-3">
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              data-testid="button-first-page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-1 mx-2">
              {generatePageNumbers(page, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
                ) : (
                  <Button
                    key={p}
                    variant={page === p ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 text-xs"
                    onClick={() => setPage(p as number)}
                    data-testid={`button-page-${p}`}
                  >
                    {p}
                  </Button>
                )
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              data-testid="button-next-page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              data-testid="button-last-page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("...", total);
  } else if (current >= total - 3) {
    pages.push(1, "...");
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }
  return pages;
}
