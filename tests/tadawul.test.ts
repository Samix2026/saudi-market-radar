import { describe, expect, it } from "vitest";
import { classifyTadawulEvent, parseTadawulAnnouncements, parseTadawulPayload } from "@/lib/tadawul";

const sourceUrl = "https://www.saudiexchange.sa/wps/portal/saudiexchange/newsandreports/issuer-news/issuer-announcements?locale=ar";

describe("موائم إفصاحات تداول", () => {
  it("يصنف أنواع الأحداث المطلوبة", () => {
    expect(classifyTadawulEvent("تعلن الشركة عن النتائج المالية السنوية")).toBe("نتائج مالية");
    expect(classifyTadawulEvent("توصية مجلس الإدارة بتوزيع أرباح نقدية")).toBe("توزيعات");
    expect(classifyTadawulEvent("تعلن الشركة عن توقيع عقد مع جهة حكومية")).toBe("عقود");
    expect(classifyTadawulEvent("دعوة المساهمين إلى اجتماع الجمعية العامة")).toBe("جمعية");
    expect(classifyTadawulEvent("إعلان إلحاقي من الشركة")).toBe("إفصاح");
  });

  it("يستخرج الحقول بالمسميات حتى عند تغير ترتيب عناصر البطاقة", () => {
    const html = `
      <article class="announcement-card">
        <div data-label="القطاع" data-value="البنوك"></div>
        <time datetime="2026-07-16 09:35:00"></time>
        <div><span data-label="رمز التداول" data-value="1180"></span></div>
        <a href="/wps/portal/saudiexchange/newsandreports/issuer-news/issuer-announcements/issuer-announcements-details/?anId=1&locale=ar">
          تعلن الشركة الأهلي السعودي عن النتائج المالية الأولية للفترة المنتهية
        </a>
        <div data-label="اسم الشركة" data-value="البنك الأهلي السعودي"></div>
      </article>`;
    const [item] = parseTadawulAnnouncements(html, sourceUrl);
    expect(item).toMatchObject({
      companyName: "البنك الأهلي السعودي", tradingSymbol: "1180", companySector: "البنوك",
      eventType: "نتائج مالية", isOfficial: true, source: "تداول السعودية",
    });
    expect(item.url).toContain("anId=1");
    expect(item.publishedAt).toBe("2026-07-16T06:35:00.000Z");
  });

  it("لا يعتمد على ترتيب الرابط أو التاريخ أو بيانات الشركة", () => {
    const html = `
      <li class="news-item">
        <div data-label="اسم الشركة" data-value="شركة اختبار"></div>
        <a title="تعلن شركة اختبار عن زيادة رأس المال" href="${sourceUrl}/issuer-announcements-details/?anId=2"></a>
        <div data-label="تاريخ الإعلان" data-value="16/07/2026 10:10:00"></div>
        <div data-label="الرمز" data-value="9999"></div>
      </li>`;
    expect(parseTadawulAnnouncements(html, sourceUrl)[0]).toMatchObject({
      companyName: "شركة اختبار", tradingSymbol: "9999", eventType: "زيادة رأس المال",
    });
  });

  it("يستخرج JSON الرسمي بأسماء الخصائص لا بترتيبها", () => {
    const payload = JSON.stringify({ announcementList: [{
      newsDateStr: "16/07/2026 15:53:18",
      announcementUrl: "/details/?anId=96835",
      SHORT_DESC: "اعلان شركة متكاملة للتأمين عن تعيين عضو في مجلس الإدارة",
      SYMBOL: "8040",
      TITLE: "متكاملة",
    }] });
    expect(parseTadawulPayload(payload, sourceUrl)[0]).toMatchObject({
      companyName: "متكاملة", tradingSymbol: "8040", eventType: "تعيين",
      publishedAt: "2026-07-16T12:53:18.000Z", isOfficial: true,
    });
  });
});
