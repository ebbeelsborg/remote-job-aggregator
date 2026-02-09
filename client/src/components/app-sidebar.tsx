import { Briefcase, LayoutDashboard, RefreshCw, ExternalLink } from "lucide-react";
import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "Jobs", url: "/", icon: Briefcase },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { toast } = useToast();

  const fetchMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/jobs/fetch");
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Jobs fetched",
        description: `Added ${data.totalAdded} new jobs from ${data.sources?.length || 0} sources`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
    },
    onError: () => {
      toast({
        title: "Fetch failed",
        description: "Could not fetch jobs. Try again later.",
        variant: "destructive",
      });
    },
  });

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Briefcase className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-none">RemoteHQ</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Job Aggregator</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>API Sources</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 space-y-1">
              {([
                { name: "Remotive", url: "https://remotive.com" },
                { name: "Himalayas", url: "https://himalayas.app" },
                { name: "Jobicy", url: "https://jobicy.com" },
                { name: "RemoteOK", url: "https://remoteok.com" },
                { name: "TheMuse", url: "https://www.themuse.com" },
              ]).map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 py-1 px-2 rounded-md hover-elevate group"
                  data-testid={`link-source-${s.name.toLowerCase().replace(/\s/g, "")}`}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-chart-2" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex-1">{s.name}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Scraped Job Boards</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 space-y-1">
              {([
                { name: "WeWorkRemotely", url: "https://weworkremotely.com" },
                { name: "WorkingNomads", url: "https://workingnomads.com" },
                { name: "DailyRemote", url: "https://dailyremote.com" },
              ]).map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 py-1 px-2 rounded-md hover-elevate group"
                  data-testid={`link-source-${s.name.toLowerCase().replace(/\s/g, "")}`}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-chart-4" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex-1">{s.name}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => fetchMutation.mutate()}
          disabled={fetchMutation.isPending}
          data-testid="button-fetch-jobs"
        >
          <RefreshCw className={`h-4 w-4 ${fetchMutation.isPending ? "animate-spin" : ""}`} />
          {fetchMutation.isPending ? "Fetching..." : "Fetch Jobs Now"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
