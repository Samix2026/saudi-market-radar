import { load } from "cheerio";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { IncomingArticle } from "./types";
import type { NewsSource } from "@/config/sources";
import { cleanText, decodeEntities } from "./text";

const MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
const USER_AGENT = "SaudiMarketRadar/0.2 (local public-news reader)";
const execFileAsync = promisify(execFile);

function tag(block: string, names: string[]): string {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
    if (match) return decodeEntities(match[1]).trim();
  }
  return "";
}

function linkFrom(block: string): string {
  const direct = tag(block, ["link"]);
  if (direct && !direct.startsWith("<")) return decodeEntities(direct).trim();
  return block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] ?? "";
}

function ministryCommerceDate(url: string): string | null {
  const match = url.match(/\/(\d{2})-(\d{2})-(\d{2}|\d{4})-/);
  if (!match) return null;
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
  return new Date(Date.UTC(year, Number(match[2]) - 1, Number(match[1]), 9)).toISOString();
}

function validDate(value: string): string | null {
  const timestamp = Date.parse(value);
  const now = Date.now();
  if (!Number.isFinite(timestamp) || timestamp < now - MAX_AGE_MS || timestamp > now + 86_400_000) return null;
  return new Date(timestamp).toISOString();
}

export function parseRss(xml: string, source: NewsSource): IncomingArticle[] {
  const blocks = xml.match(/<(?:item|entry)(?:\s[^>]*)?>[\s\S]*?<\/(?:item|entry)>/gi) ?? [];
  return blocks.flatMap((block) => {
    const url = linkFrom(block) || tag(block, ["guid", "id"]);
    const rawDate = source.dateFromUrl === "mc-news"
      ? ministryCommerceDate(url)
      : tag(block, ["pubDate", "published", "updated"]);
    const publishedAt = rawDate ? validDate(rawDate) : null;
    const title = cleanText(tag(block, ["title"]));
    if (!title || !url || !publishedAt) return [];
    return [{
      title,
      source: source.name,
      publishedAt,
      description: cleanText(tag(block, ["description", "summary", "content:encoded", "content"])),
      url,
    }];
  });
}

async function fetchText(url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/atom+xml, text/html;q=0.9" },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : "تعذر الاتصال";
    if (/certificate|self signed|unable to verify/i.test(cause)) {
      try {
        const { stdout } = await execFileAsync("curl", [
          "--silent", "--show-error", "--location", "--fail",
          "--max-time", "15", "--user-agent", USER_AGENT, url,
        ], { maxBuffer: 5 * 1024 * 1024, encoding: "utf8" });
        return stdout;
      } catch (curlError) {
        throw new Error(curlError instanceof Error ? curlError.message : cause);
      }
    }
    throw new Error(cause);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function resolveDetail(article: IncomingArticle): Promise<IncomingArticle | null> {
  try {
    const $ = load(await fetchText(article.url));
    const rawDate = $("meta[property='article:published_time']").attr("content")
      || $("meta[itemprop='datePublished']").attr("content")
      || $("time[datetime]").first().attr("datetime")
      || "";
    const publishedAt = validDate(rawDate);
    if (!publishedAt) return null;
    return {
      ...article,
      publishedAt,
      description: cleanText($("meta[name='description']").attr("content") || article.description || ""),
    };
  } catch {
    return null;
  }
}

async function parsePage(html: string, source: NewsSource): Promise<IncomingArticle[]> {
  if (!source.html) return [];
  const $ = load(html);
  const candidates: IncomingArticle[] = [];
  const seen = new Set<string>();
  const roots = source.html.itemSelector ? $(source.html.itemSelector) : $(source.html.linkSelector);

  roots.each((_, root) => {
    const container = $(root);
    const link = source.html?.itemSelector ? container.find(source.html.linkSelector).first() : container;
    const href = link.attr("href");
    if (!href) return;
    const url = new URL(href, source.url).toString();
    if (seen.has(url)) return;
    const title = cleanText(source.html?.titleSelector ? container.find(source.html.titleSelector).first().text() : link.text());
    if (!title || title.length < 15) return;
    const rawDate = source.html?.dateSelector
      ? container.find(source.html.dateSelector).first().attr("datetime") || container.find(source.html.dateSelector).first().text()
      : "";
    const publishedAt = rawDate ? validDate(rawDate) : null;
    const description = source.html?.descriptionSelector
      ? cleanText(container.find(source.html.descriptionSelector).first().text())
      : "";
    seen.add(url);
    candidates.push({ title, source: source.name, publishedAt: publishedAt || "", description, url });
  });

  if (source.html.resolveDetails) {
    const resolved = await Promise.all(candidates.slice(0, 12).map(resolveDetail));
    return resolved.filter((item): item is IncomingArticle => item !== null);
  }
  return candidates.filter((item) => Boolean(item.publishedAt));
}

export async function fetchSource(source: NewsSource): Promise<IncomingArticle[]> {
  const body = await fetchText(source.url);
  const items = source.type === "rss" ? parseRss(body, source) : await parsePage(body, source);
  if (!items.length) throw new Error("لم يُعثر على أخبار حديثة صالحة");
  return items.slice(0, 30);
}
