import { db } from "./db";
import { sql } from "drizzle-orm";
import { storage } from "./storage";
import { fetchAllJobs } from "./job-fetcher";
import { insertSettingsSchema } from "@shared/schema";
import { log, getLogs } from "./log";
import type { Express } from "express";
import { type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/logs", isAuthenticated, async (_req, res) => {
    try {
      res.json(getLogs());
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  });

  app.get("/api/jobs", isAuthenticated, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
      const search = (req.query.search as string) || undefined;
      const level = (req.query.level as string) || undefined;
      const companiesRaw = (req.query.companies as string) || undefined;
      const companies = companiesRaw ? companiesRaw.split(",").filter(Boolean) : undefined;
      const sortBy = (req.query.sortBy as string) || undefined;

      const result = await storage.getJobs({ page, limit, search, level, companies, sortBy });

      res.json({
        jobs: result.jobs,
        total: result.total,
        page,
        totalPages: Math.ceil(result.total / limit),
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/jobs/:id/status", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!status || !["applied", "ignored"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'applied' or 'ignored'." });
      }

      const updated = await storage.updateJobStatus(id, status);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/jobs/:id/status", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateJobStatus(id, null);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/companies", isAuthenticated, async (_req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/stats", isAuthenticated, async (_req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/jobs/fetch", isAuthenticated, async (_req, res) => {
    try {
      const result = await fetchAllJobs();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/settings", isAuthenticated, async (_req, res) => {
    try {
      const s = await storage.getSettings();
      res.json(s);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/settings", isAuthenticated, async (req, res) => {
    try {
      log(`PATCH /api/settings request: ${JSON.stringify(req.body)}`, "api");

      const result = insertSettingsSchema.partial().safeParse(req.body);
      if (!result.success) {
        log(`Validation failed: ${result.error.message}`, "api");
        return res.status(400).json({ message: "Invalid settings data", errors: result.error.errors });
      }

      const s = await storage.getSettings();
      const updated = await storage.updateSettings(s.id, result.data);

      log(`Settings updated successfully for ID ${s.id}`, "api");
      res.json(updated);
    } catch (error: any) {
      log(`Error updating settings: ${error.message}`, "api");
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
