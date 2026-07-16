import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { NewsItem, Sector, SourceStatus } from "./types";
import type { NewsSource } from "@/config/sources";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "radar.db"));
db.exec("PRAGMA busy_timeout = 5000;");
db.exec(`
  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    published_at TEXT NOT NULL,
    sector TEXT NOT NULL,
    summary TEXT NOT NULL,
    business_impact TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    importance INTEGER NOT NULL CHECK (importance BETWEEN 1 AND 5),
    company_name TEXT,
    trading_symbol TEXT,
    company_sector TEXT,
    event_type TEXT,
    is_official INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
  CREATE INDEX IF NOT EXISTS idx_articles_sector ON articles(sector);
  CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);
  CREATE TABLE IF NOT EXISTS source_status (
    source_id TEXT PRIMARY KEY,
    source_name TEXT NOT NULL,
    category TEXT NOT NULL,
    source_type TEXT NOT NULL,
    url TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    last_success TEXT,
    last_failure TEXT,
    failure_count INTEGER NOT NULL DEFAULT 0,
    item_count INTEGER NOT NULL DEFAULT 0,
    latest_published_at TEXT,
    last_error TEXT
  );
`);

const articleColumns = new Set((db.prepare("PRAGMA table_info(articles)").all() as { name: string }[]).map((row) => row.name));
for (const [name, definition] of Object.entries({
  company_name: "TEXT", trading_symbol: "TEXT", company_sector: "TEXT",
  event_type: "TEXT", is_official: "INTEGER NOT NULL DEFAULT 0",
})) {
  if (!articleColumns.has(name)) db.exec(`ALTER TABLE articles ADD COLUMN ${name} ${definition}`);
}

type ArticleRow = {
  id: number; title: string; source: string; published_at: string; sector: string;
  summary: string; business_impact: string; url: string; importance: number; created_at: string;
  company_name: string | null; trading_symbol: string | null; company_sector: string | null;
  event_type: NewsItem["eventType"] | null; is_official: number;
};

function mapRow(row: ArticleRow): NewsItem {
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    publishedAt: row.published_at,
    sector: row.sector as Sector,
    summary: row.summary,
    businessImpact: row.business_impact,
    url: row.url,
    importance: row.importance,
    createdAt: row.created_at,
    companyName: row.company_name ?? undefined,
    tradingSymbol: row.trading_symbol ?? undefined,
    companySector: row.company_sector ?? undefined,
    eventType: row.event_type ?? undefined,
    isOfficial: Boolean(row.is_official),
  };
}

export function countArticles(): number {
  return (db.prepare("SELECT COUNT(*) AS count FROM articles").get() as { count: number }).count;
}

export function getAllArticles(): NewsItem[] {
  return (db.prepare(`
    SELECT * FROM articles
    WHERE published_at >= datetime('now', '-180 days')
    ORDER BY published_at DESC
  `).all() as ArticleRow[]).map(mapRow);
}

export function getVisibleArticles(): NewsItem[] {
  return getAllArticles().filter((article) => article.source !== "بيانات تجريبية");
}

export function insertArticle(article: Omit<NewsItem, "id" | "createdAt">): boolean {
  const result = db.prepare(`
    INSERT OR IGNORE INTO articles
    (title, source, published_at, sector, summary, business_impact, url, importance,
     company_name, trading_symbol, company_sector, event_type, is_official)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(article.title, article.source, article.publishedAt, article.sector, article.summary,
    article.businessImpact, article.url, article.importance, article.companyName ?? null,
    article.tradingSymbol ?? null, article.companySector ?? null, article.eventType ?? null,
    article.isOfficial ? 1 : 0);
  return result.changes > 0;
}

export function updateArticleClassification(id: number, sector: Sector, businessImpact: string): void {
  db.prepare("UPDATE articles SET sector = ?, business_impact = ? WHERE id = ?").run(sector, businessImpact, id);
}

export function registerSources(sources: NewsSource[]): void {
  const statement = db.prepare(`
    INSERT INTO source_status (source_id, source_name, category, source_type, url, active)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(source_id) DO UPDATE SET
      source_name = excluded.source_name,
      category = excluded.category,
      source_type = excluded.source_type,
      url = excluded.url,
      active = excluded.active
  `);
  for (const source of sources) {
    statement.run(source.id, source.name, source.category, source.type, source.url, source.active ? 1 : 0);
  }
}

export function recordSourceSuccess(source: NewsSource, itemCount: number, latestPublishedAt: string | null): void {
  db.prepare(`
    UPDATE source_status SET
      last_success = ?, failure_count = 0, item_count = ?,
      latest_published_at = ?, last_error = NULL
    WHERE source_id = ?
  `).run(new Date().toISOString(), itemCount, latestPublishedAt, source.id);
}

export function recordSourceFailure(source: NewsSource, error: string): void {
  db.prepare(`
    UPDATE source_status SET
      last_failure = ?, failure_count = failure_count + 1,
      item_count = 0, last_error = ?
    WHERE source_id = ?
  `).run(new Date().toISOString(), error, source.id);
}

type SourceStatusRow = {
  source_id: string; source_name: string; category: SourceStatus["category"];
  source_type: SourceStatus["type"]; url: string; active: number;
  last_success: string | null; last_failure: string | null; failure_count: number;
  item_count: number; latest_published_at: string | null; last_error: string | null;
};

export function getSourceStatuses(): SourceStatus[] {
  return (db.prepare("SELECT * FROM source_status ORDER BY source_name").all() as SourceStatusRow[]).map((row) => ({
    id: row.source_id,
    name: row.source_name,
    category: row.category,
    type: row.source_type,
    url: row.url,
    active: Boolean(row.active),
    lastSuccess: row.last_success,
    lastFailure: row.last_failure,
    failureCount: row.failure_count,
    itemCount: row.item_count,
    latestPublishedAt: row.latest_published_at,
    lastError: row.last_error,
  }));
}
