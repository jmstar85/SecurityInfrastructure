import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const codeExamples = pgTable("code_examples", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  code: text("code").notNull(),
  language: text("language").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const searchQueries = pgTable("search_queries", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  count: integer("count").default(1).notNull(),
  lastSearched: timestamp("last_searched").defaultNow().notNull(),
});

export const insertCodeExampleSchema = createInsertSchema(codeExamples).omit({
  id: true,
  createdAt: true,
});

export const insertSearchQuerySchema = createInsertSchema(searchQueries).omit({
  id: true,
  lastSearched: true,
});

export type InsertCodeExample = z.infer<typeof insertCodeExampleSchema>;
export type CodeExample = typeof codeExamples.$inferSelect;
export type InsertSearchQuery = z.infer<typeof insertSearchQuerySchema>;
export type SearchQuery = typeof searchQueries.$inferSelect;
