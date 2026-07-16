import { describe, expect, it } from "vitest";
import { parseRss } from "@/lib/rss";
import type { NewsSource } from "@/config/sources";

const commerce: NewsSource = {
  id: "mc-news",
  name: "وزارة التجارة",
  url: "https://mc.gov.sa/ar/Pages/RSSFeed.aspx",
  active: true,
  language: "ar",
  category: "رسمي",
  type: "rss",
  dateFromUrl: "mc-news",
};

describe("تحليل RSS", () => {
  it("يستخرج التاريخ الميلادي لأخبار وزارة التجارة من الرابط", () => {
    const xml = `<rss><channel><item><title>وزارة التجارة تصدر نشرة المستهلك للربع الثاني</title><link>https://mc.gov.sa/ar/mediacenter/News/Pages/16-07-26-01.aspx</link><description>تفاصيل الخبر</description><pubDate>02/02/48 02:32:02 م</pubDate></item></channel></rss>`;
    const items = parseRss(xml, commerce);
    expect(items).toHaveLength(1);
    expect(items[0].publishedAt).toBe("2026-07-16T09:00:00.000Z");
  });
});
