import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type { NewsSource } from "@/config/sources";
import type { EventType, IncomingArticle } from "./types";
import { cleanText } from "./text";

const DETAIL_PATH = "/wps/portal/saudiexchange/newsandreports/issuer-news/issuer-announcements/issuer-announcements-details/";

const eventRules: Array<[EventType, RegExp]> = [
  ["نتائج مالية", /النتائج المالية|القوائم المالية|النتائج الأولية|صافي (?:الربح|الخسارة)/],
  ["توزيعات", /توزيع(?:ات)? (?:أرباح|نقدية)|الأرباح النقدية|استحقاق الأرباح/],
  ["زيادة رأس المال", /زيادة رأس المال|رفع رأس المال|أسهم منحة/],
  ["تخفيض رأس المال", /تخفيض رأس المال|خفض رأس المال/],
  ["استحواذ", /استحواذ|شراء حصة|الاستحواذ/],
  ["اندماج", /اندماج|الاندماج/],
  ["عقود", /ترسية|توقيع عقد|تجديد عقد|عقد(?:اً|ا)? مع/],
  ["مشروع", /إطلاق مشروع|بدء مشروع|تطوير مشروع|مشروع جديد/],
  ["جمعية", /الجمعية العامة|دعوة المساهمين|اجتماع الجمعية/],
  ["طرح", /طرح|اكتتاب|إدراج/],
  ["تعيين", /تعيين|استقالة|الرئيس التنفيذي|عضو مجلس الإدارة/],
];

export function classifyTadawulEvent(title: string): EventType {
  return eventRules.find(([, pattern]) => pattern.test(title))?.[0] ?? "إفصاح";
}

function normalizeDate(value: string): string | null {
  const normalized = value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  const iso = normalized.match(/(20\d{2})[-/]([01]?\d)[-/]([0-3]?\d)(?:\s+([0-2]?\d):([0-5]\d)(?::([0-5]\d))?)?/);
  const dmy = normalized.match(/([0-3]?\d)[-/]([01]?\d)[-/](20\d{2})(?:\s+([0-2]?\d):([0-5]\d)(?::([0-5]\d))?)?/);
  const match = iso ?? dmy;
  if (!match) return null;
  const [year, month, day, hour = "00", minute = "00", second = "00"] = iso
    ? [match[1], match[2], match[3], match[4], match[5], match[6]]
    : [match[3], match[2], match[1], match[4], match[5], match[6]];
  const date = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute}:${second}+03:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function valueByLabel(container: cheerio.Cheerio<AnyNode>, labels: RegExp): string {
  let result = "";
  container.find("[data-label], dt, th, label, .label").each((_, element) => {
    const label = cleanText(container.find(element).attr("data-label") || container.find(element).text());
    if (result || !labels.test(label)) return;
    const node = container.find(element);
    result = cleanText(node.attr("data-value") || node.next("dd, td, span, div").first().text());
  });
  return result;
}

export function parseTadawulAnnouncements(html: string, sourceUrl: string): IncomingArticle[] {
  const $ = cheerio.load(html);
  const links = $(`a[href*="issuer-announcements-details"], a[href*="anId="]`);
  const seen = new Set<string>();
  const items: IncomingArticle[] = [];

  links.each((_, element) => {
    const link = $(element);
    const href = link.attr("href");
    if (!href) return;
    const url = new URL(href, sourceUrl).toString();
    if (seen.has(url)) return;
    const container = link.closest("article, li, tr, .announcement, .announcement-card, .news-item, .card");
    const scope = container.length ? container : link.parent();
    const title = cleanText(link.attr("title") || link.find("h2,h3,h4,.title").first().text() || link.text());
    if (!title || title.length < 12) return;

    const allText = cleanText(scope.text());
    const symbol = valueByLabel(scope, /الرمز|رمز التداول/) ||
      title.match(/\(([0-9]{4,6})\)/)?.[1] || allText.match(/(?:رمز التداول|الرمز)\s*:?\s*([0-9]{4,6})/)?.[1] || "";
    const companyName = valueByLabel(scope, /اسم الشركة|المصدر/) ||
      title.match(/(?:تعلن|إعلان)\s+(?:شركة|صندوق)\s+(.+?)(?:\s+عن|\s+دعوة|\s+نتائج)/)?.[1]?.trim() || "";
    const companySector = valueByLabel(scope, /القطاع/) || scope.find("[data-sector], .sector").first().attr("data-sector") || cleanText(scope.find(".sector").first().text());
    const rawDate = valueByLabel(scope, /وقت الإعلان|تاريخ الإعلان|التاريخ/) ||
      scope.find("time").first().attr("datetime") || cleanText(scope.find("time, .date, .announcement-date").first().text()) || allText;
    const publishedAt = normalizeDate(rawDate);
    if (!publishedAt) return;

    seen.add(url);
    items.push({
      title, source: "تداول السعودية", publishedAt, url,
      description: companyName ? `إعلان رسمي صادر عن ${companyName}${symbol ? ` (${symbol})` : ""}.` : "إعلان رسمي منشور عبر تداول السعودية.",
      companyName: companyName || undefined,
      tradingSymbol: symbol || undefined,
      companySector: companySector || undefined,
      eventType: classifyTadawulEvent(title),
      isOfficial: true,
    });
  });
  return items;
}

type TadawulRecord = Record<string, unknown>;

function recordText(record: TadawulRecord, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return cleanText(value);
    if (typeof value === "number") return String(value);
  }
  return "";
}

export function parseTadawulPayload(payload: string, sourceUrl: string): IncomingArticle[] {
  const parsed = JSON.parse(payload) as { announcementList?: TadawulRecord[] };
  if (!Array.isArray(parsed.announcementList)) return [];
  return parsed.announcementList.flatMap((record) => {
    const title = recordText(record, "SHORT_DESC", "shortDesc", "title");
    const companyName = recordText(record, "TITLE", "indexName", "companyName");
    const tradingSymbol = recordText(record, "SYMBOL", "indexSymbol", "symbol");
    const rawDate = recordText(record, "newsDateStr", "timestampStr", "timestamp", "PR_DATE");
    const href = recordText(record, "announcementUrl", "url");
    const publishedAt = normalizeDate(rawDate);
    if (!title || !href || !publishedAt) return [];
    return [{
      title, source: "تداول السعودية", publishedAt,
      url: new URL(href, sourceUrl).toString(),
      description: `إعلان رسمي صادر عن ${companyName || "شركة مدرجة"}${tradingSymbol ? ` (${tradingSymbol})` : ""}.`,
      companyName: companyName || undefined,
      tradingSymbol: tradingSymbol || undefined,
      eventType: classifyTadawulEvent(title), isOfficial: true,
    } satisfies IncomingArticle];
  });
}

export async function fetchTadawulAnnouncements(source: NewsSource): Promise<IncomingArticle[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const headers = {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ar-SA,ar;q=0.9",
      "User-Agent": "SaudiMarketRadar/1.0 (+local business-news monitor)",
    };
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const htmlItems = parseTadawulAnnouncements(html, source.url);
    if (htmlItems.length) return htmlItems;

    const action = "p0/IZ7_5A602H80O0HTC060SG6UT81DI1=CZ6_5A602H80O0HTC060SG6UT81D26=NJgetAnnouncementListData=/";
    const rawActionUrl = `${new URL(source.url).origin}${new URL(source.url).pathname.replace(/\/?$/, "/")}${action}`;
    const cookies = response.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
    const form = new URLSearchParams({
      annoucmentType: "1_-1", symbol: "", sectorDpId: "", searchType: "1",
      fromDate: "", toDate: "", datePeriod: "7 day", productType: "",
      advisorsList: "", textSearch: "", pageNumberDb: "1", pageSize: "50",
    });
    const requestHeaders = {
      ...headers, Accept: "application/json, text/plain, */*",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest", Referer: response.url, Cookie: cookies,
    };
    const bridge = await fetch(rawActionUrl, { method: "POST", headers: requestHeaders, body: form, signal: controller.signal });
    const bridgeHtml = await bridge.text();
    const $bridge = cheerio.load(bridgeHtml);
    const baseUrl = $bridge("base[href]").attr("href");
    if (!baseUrl) throw new Error("لم تُرجع تداول رابط مورد الإعلانات الموقّع");
    const dataUrl = new URL(action, baseUrl).toString();
    const dataResponse = await fetch(dataUrl, { method: "POST", headers: requestHeaders, body: form, signal: controller.signal });
    if (!dataResponse.ok) throw new Error(`HTTP ${dataResponse.status} من مورد الإعلانات`);
    const items = parseTadawulPayload(await dataResponse.text(), source.url);
    if (!items.length) throw new Error("لم تُكتشف إعلانات في الصفحة الرسمية؛ قد تكون حماية الموقع أو بنية الصفحة قد تغيرت");
    return items;
  } finally {
    clearTimeout(timeout);
  }
}

export const TADAWUL_DETAIL_PATH = DETAIL_PATH;
