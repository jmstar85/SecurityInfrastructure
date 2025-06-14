import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get all code examples
  app.get("/api/code-examples", async (_req, res) => {
    try {
      const examples = await storage.getAllCodeExamples();
      res.json(examples);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch code examples" });
    }
  });

  // Get code examples by category
  app.get("/api/code-examples/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const examples = await storage.getCodeExamplesByCategory(category);
      res.json(examples);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch code examples by category" });
    }
  });

  // Search code examples
  app.get("/api/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      const results = await storage.searchCodeExamples(q);
      
      // Track search query
      await storage.trackSearchQuery(q);
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Get popular search queries
  app.get("/api/search/popular", async (_req, res) => {
    try {
      const popular = await storage.getPopularSearchQueries();
      res.json(popular);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch popular searches" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
