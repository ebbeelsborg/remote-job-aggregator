import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings as SettingsIcon, Plus, X, RotateCcw, Save } from "lucide-react";
import type { Settings } from "@shared/schema";

export default function SettingsPage() {
  const { toast } = useToast();
  const [newTitle, setNewTitle] = useState("");

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<Settings>) => {
      const res = await apiRequest("PATCH", "/api/settings", updatedSettings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your harvesting preferences have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to update settings",
        description: error.message,
      });
    },
  });

  const handleAddTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !settings) return;

    const trimmed = newTitle.trim().toLowerCase();
    if (settings.whitelistedTitles.includes(trimmed)) {
      setNewTitle("");
      return;
    }

    updateMutation.mutate({
      whitelistedTitles: [...settings.whitelistedTitles, trimmed],
    });
    setNewTitle("");
  };

  const handleRemoveTitle = (title: string) => {
    if (!settings) return;
    updateMutation.mutate({
      whitelistedTitles: settings.whitelistedTitles.filter((t) => t !== title),
    });
  };

  const handleToggleMode = (fuzzy: boolean) => {
    if (!settings) return;
    updateMutation.mutate({
      harvestingMode: fuzzy ? "fuzzy" : "exact",
    });
  };

  const handleReset = () => {
    if (!confirm("Are you sure you want to reset to default settings?")) return;
    updateMutation.mutate({
      whitelistedTitles: ["software", "engineer", "developer", "dev", "fullstack", "frontend", "backend", "swe", "sde", "sdet", "sre", "platform", "infrastructure", "infra", "mobile", "ios", "android", "cloud", "devops", "ai"],
      harvestingMode: "fuzzy",
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-64 w-full bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <SettingsIcon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your job harvesting and filtering preferences.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle>Harvesting Strategy</CardTitle>
            <CardDescription>
              Choose how strictly we match job titles against your whitelist.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-muted-foreground/10">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Fuzzy Matching</Label>
                <p className="text-sm text-muted-foreground">
                  Match titles that <strong>contain</strong> whitelisted words (e.g., "Senior Software Architect" matches "software").
                </p>
              </div>
              <Switch
                checked={settings?.harvestingMode === "fuzzy"}
                onCheckedChange={handleToggleMode}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Job Title Whitelist</CardTitle>
              <CardDescription>
                Only jobs containing these keywords (fuzzy) or matching exactly will be harvested.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleAddTitle} className="flex gap-2">
              <Input
                placeholder="Add title (e.g. data scientist, ml engineer)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="max-w-md focus-visible:ring-primary"
              />
              <Button type="submit" size="icon" disabled={updateMutation.isPending}>
                <Plus className="w-4 h-4" />
              </Button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
              {settings?.whitelistedTitles.map((title) => (
                <Badge
                  key={title}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm font-medium gap-1.5 bg-secondary/50 hover:bg-secondary border-none"
                >
                  {title}
                  <button
                    onClick={() => handleRemoveTitle(title)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
          <Save className="w-3 h-3" />
          Changes are auto-saved.
        </p>
      </div>
    </div>
  );
}
