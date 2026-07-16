import { newsSources } from "@/config/sources";
import { businessImpactFor, classifySector, scoreImportance } from "./classifier";
import {
  countArticles, getAllArticles, insertArticle, recordSourceFailure,
  recordSourceSuccess, registerSources, updateArticleClassification,
} from "./db";
import { fetchSource } from "./rss";
import { fetchTadawulAnnouncements } from "./tadawul";
import { seedArticles } from "./seed";
import { summarizeArabic } from "./summarizer";
import { cleanText, isDuplicate } from "./text";
import type { IncomingArticle } from "./types";

export type RefreshResult = { fetched: number; added: number; duplicates: number; errors: string[] };

export function ingestArticles(items: IncomingArticle[]): Omit<RefreshResult, "errors"> {
  const existing = getAllArticles();
  const acceptedTitles = existing.map((item) => item.title);
  let added = 0;
  let duplicates = 0;

  for (const item of items) {
    const title = cleanText(item.title);
    if (!title || acceptedTitles.some((candidate) => isDuplicate(title, candidate))) {
      duplicates += 1;
      continue;
    }
    const body = `${title} ${item.description ?? ""}`;
    const sector = classifySector(body);
    const importance = scoreImportance(body);
    const inserted = insertArticle({
      title,
      source: item.source,
      publishedAt: item.publishedAt,
      sector,
      summary: summarizeArabic(title, item.description),
      businessImpact: businessImpactFor(sector, importance),
      url: item.url,
      importance,
      companyName: item.companyName,
      tradingSymbol: item.tradingSymbol,
      companySector: item.companySector ?? (item.isOfficial ? sector : undefined),
      eventType: item.eventType,
      isOfficial: item.isOfficial,
    });
    if (inserted) {
      acceptedTitles.push(title);
      added += 1;
    } else duplicates += 1;
  }
  return { fetched: items.length, added, duplicates };
}

export function ensureSeedData(): void {
  registerSources(newsSources);
  if (countArticles() === 0) ingestArticles(seedArticles);
  for (const article of getAllArticles()) {
    const sector = classifySector(`${article.title} ${article.summary}`);
    if (sector !== article.sector) {
      updateArticleClassification(article.id, sector, businessImpactFor(sector, article.importance));
    }
  }
}

export async function refreshNews(): Promise<RefreshResult> {
  ensureSeedData();
  const results = await Promise.allSettled(newsSources.filter((source) => source.active).map(async (source) => {
    try {
      const articles = source.type === "adapter"
        ? await fetchTadawulAnnouncements(source)
        : await fetchSource(source);
      const latest = articles.reduce<string | null>((current, article) =>
        !current || article.publishedAt > current ? article.publishedAt : current, null);
      recordSourceSuccess(source, articles.length, latest);
      return articles;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      recordSourceFailure(source, message);
      throw new Error(`${source.name}: ${message}`);
    }
  }));
  const items: IncomingArticle[] = [];
  const errors: string[] = [];
  results.forEach((result) => {
    if (result.status === "fulfilled") items.push(...result.value);
    else errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
  });
  return { ...ingestArticles(items), errors };
}
