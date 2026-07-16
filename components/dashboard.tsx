"use client";

import { useMemo, useState } from "react";
import type { NewsItem, SourceStatus } from "@/lib/types";
import { EVENT_TYPES, SECTORS } from "@/lib/types";
import { toRiyadhDateKey } from "@/lib/date";

const dateFormatter = new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Riyadh" });
const updateFormatter = new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Riyadh" });

function Importance({ value }: { value: number }) {
  return <span className={`importance importance-${value}`}>أهمية {value}/5</span>;
}

function NewsCard({ article }: { article: NewsItem }) {
  return (
    <article className="news-card">
      <div className="card-topline">
        <div className="card-tags"><span className="sector-tag">{article.sector}</span>{article.isOfficial && <span className="official-badge">إعلان رسمي</span>}</div>
        <Importance value={article.importance} />
      </div>
      <h3>{article.title}</h3>
      <div className="meta"><span>{article.source === "بيانات تجريبية" ? "بيانات تجريبية · وضع التطوير" : article.source}</span><span>•</span><time>{dateFormatter.format(new Date(article.publishedAt))}</time>{article.tradingSymbol && <><span>•</span><span>{article.companyName} · {article.tradingSymbol}</span></>}</div>
      {article.eventType && <div className="event-line"><span>نوع الحدث</span><b>{article.eventType}</b>{article.companySector && <small>{article.companySector}</small>}</div>}
      <p className="summary">{article.summary}</p>
      <div className="impact"><span>لماذا يهم للأعمال؟</span><p>{article.businessImpact}</p></div>
      <a className="source-link" href={article.url} target="_blank" rel="noreferrer">فتح المصدر <span aria-hidden>↗</span></a>
    </article>
  );
}

type Props = { initialArticles: NewsItem[]; initialSources: SourceStatus[] };

export function Dashboard({ initialArticles, initialSources }: Props) {
  const [articles, setArticles] = useState(initialArticles);
  const [sourceStatuses, setSourceStatuses] = useState(initialSources);
  const [sector, setSector] = useState("الكل");
  const [source, setSource] = useState("الكل");
  const [date, setDate] = useState("");
  const [eventType, setEventType] = useState("الكل");
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");

  const sources = useMemo(() => sourceStatuses
    .filter((item) => item.active && item.itemCount > 0 && item.lastSuccess)
    .map((item) => item.name), [sourceStatuses]);
  const liveSourceCount = sources.length;
  const activeSourceCount = sourceStatuses.filter((item) => item.active).length;
  const successfulSourceCount = sourceStatuses.filter((item) => item.active && item.itemCount > 0 && item.lastSuccess).length;
  const troubledSourceCount = sourceStatuses.filter((item) => item.active && item.failureCount > 0).length;
  const lastUpdated = useMemo(() => {
    const timestamp = Math.max(...articles.map((item) => Date.parse(item.createdAt)).filter(Number.isFinite));
    return Number.isFinite(timestamp) ? updateFormatter.format(new Date(timestamp)) : "لا يوجد تحديث";
  }, [articles]);
  const filtered = useMemo(() => articles.filter((article) => {
    const matchesDate = !date || toRiyadhDateKey(article.publishedAt) === date;
    return (sector === "الكل" || article.sector === sector) && (source === "الكل" || article.source === source) &&
      (eventType === "الكل" || article.eventType === eventType) && matchesDate;
  }), [articles, sector, source, date, eventType]);

  const tadawulAnnouncements = useMemo(() => articles
    .filter((article) => article.isOfficial && article.source === "تداول السعودية")
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 5), [articles]);

  const today = toRiyadhDateKey(new Date());
  const topFive = articles.filter((article) => toRiyadhDateKey(article.publishedAt) === today)
    .sort((a, b) => b.importance - a.importance).slice(0, 5);
  const hasTodayNews = topFive.length > 0;
  const highlighted = (hasTodayNews ? topFive : articles.slice().sort((a, b) => b.importance - a.importance || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))).slice(0, 5);
  const opportunities = articles.filter((article, index, list) =>
    article.importance >= 3 && list.findIndex((candidate) => candidate.sector === article.sector && candidate.importance >= 3) === index
  ).slice(0, 4);

  async function refresh() {
    setRefreshing(true);
    setNotice("");
    try {
      const response = await fetch("/api/news", { method: "POST" });
      const result = await response.json() as { added: number; duplicates: number; errors: string[] };
      const newsResponse = await fetch("/api/news", { cache: "no-store" });
      const news = await newsResponse.json() as { articles: NewsItem[]; sources: SourceStatus[] };
      setArticles(news.articles);
      setSourceStatuses(news.sources);
      const failureDetails = result.errors.length ? ` تعذر تحديث: ${result.errors.join("، ")}.` : "";
      setNotice(`اكتمل التحديث: ${result.added} جديد، ${result.duplicates} مكرر.${failureDetails}`);
    } catch {
      setNotice("تعذر التحديث الآن. البيانات المحفوظة ما زالت متاحة.");
    } finally { setRefreshing(false); }
  }

  return (
    <main>
      <header className="app-header">
        <div className="header-inner">
          <div className="brand"><span className="brand-mark">ر</span><strong>رادار السوق السعودي</strong></div>
          <div className="header-actions">
            <span className="header-update"><i /> آخر تحديث: <b>{lastUpdated}</b></span>
            <button className="refresh-button refresh-button-header" onClick={refresh} disabled={refreshing}><span className={refreshing ? "spin" : ""}>↻</span>{refreshing ? "جارٍ التحديث" : "تحديث الأخبار"}</button>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <div>
            <p className="eyebrow">لوحة متابعة الأعمال</p>
            <h1>إشارات السوق السعودي</h1>
            <p>رادار ذكي يجمع الأخبار الاقتصادية، يزيل التكرار، ويبرز ما يهم أصحاب الأعمال.</p>
          </div>
          <button className="refresh-button refresh-button-hero" onClick={refresh} disabled={refreshing}><span className={refreshing ? "spin" : ""}>↻</span>{refreshing ? "جارٍ تحديث الأخبار" : "تحديث الأخبار"}</button>
        </div>
      </section>

      <div className="page-shell">
        {notice && <div className="notice" role="status">{notice}</div>}
        <section className="metrics" aria-label="ملخص لوحة المعلومات">
          <div className="metric-card"><span>الأخبار</span><strong>{articles.length}</strong><small>خبرًا حديثًا</small></div>
          <div className="metric-card"><span>المصادر</span><strong>{liveSourceCount}</strong><small>مصادر حية</small></div>
          <div className="metric-card"><span>القطاعات</span><strong>{SECTORS.length}</strong><small>قطاعات مغطاة</small></div>
          <div className="metric-card metric-card-update"><span>آخر تحديث</span><strong>{lastUpdated}</strong><small>بتوقيت الرياض</small></div>
        </section>
        <section className="tadawul-section" aria-labelledby="tadawul-title">
          <div className="section-heading"><div><span className="kicker">المصدر الرسمي الأهم</span><h2 id="tadawul-title">آخر إفصاحات تداول</h2></div><span className="official-badge">إعلانات رسمية</span></div>
          {tadawulAnnouncements.length ? <div className="tadawul-list">{tadawulAnnouncements.map((item) =>
            <a href={item.url} target="_blank" rel="noreferrer" key={item.id}>
              <time>{updateFormatter.format(new Date(item.publishedAt))}</time>
              <div>
                <div className="tadawul-company"><b>{item.companyName}</b>{item.tradingSymbol && <span dir="ltr">{item.tradingSymbol}</span>}{item.eventType && <span className="event-chip">{item.eventType}</span>}</div>
                <strong>{item.title}</strong>
              </div>
              <span aria-hidden>↗</span>
            </a>
          )}</div> : <div className="empty compact-empty">لا توجد إفصاحات محفوظة بعد. سيحاول زر تحديث الأخبار جلبها من صفحة تداول الرسمية.</div>}
        </section>
        <section className="top-section">
          <div className="section-heading"><div><span className="kicker">الموجز التنفيذي</span><h2>{hasTodayNews ? "أهم 5 تطورات اليوم" : "أبرز التطورات المتاحة"}</h2></div><span className="live"><i /> {hasTodayNews ? "أخبار اليوم" : "لا توجد أخبار منشورة اليوم"}</span></div>
          <div className="top-grid">
            {highlighted.map((item, index) => <a key={item.id} href={`#article-${item.id}`} className="top-item"><b>{String(index + 1).padStart(2, "0")}</b><div><span>{item.sector}</span><h3>{item.title}</h3><small>{item.source}</small></div></a>)}
          </div>
        </section>

        <section className="signals-section">
          <div className="section-heading"><div><span className="kicker">رادار الفرص</span><h2>فرص ومؤشرات تستحق المتابعة</h2></div></div>
          <div className="signal-grid">{opportunities.map((item) => <div className="signal" key={item.id}><span>↗</span><div><small>{item.sector}</small><strong>{item.title}</strong><p>{item.businessImpact.split(" مستوى")[0]}</p></div></div>)}</div>
          <p className="disclaimer">هذه مؤشرات معلوماتية للأعمال وليست توصيات استثمارية أو توقعات لأسعار الأسهم.</p>
        </section>

        <section className="feed-section">
          <div className="section-heading"><div><span className="kicker">تغطية السوق</span><h2>آخر الأخبار والتحليلات</h2></div><span className="result-count">{filtered.length} نتيجة</span></div>
          <div className="filters">
            <label><span>القطاع</span><select value={sector} onChange={(e) => setSector(e.target.value)}><option>الكل</option>{SECTORS.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>المصدر</span><select value={source} onChange={(e) => setSource(e.target.value)}><option>الكل</option>{sources.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>نوع الحدث</span><select value={eventType} onChange={(e) => setEventType(e.target.value)}><option>الكل</option>{EVENT_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>التاريخ</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            {(sector !== "الكل" || source !== "الكل" || eventType !== "الكل" || date) && <button className="clear" onClick={() => { setSector("الكل"); setSource("الكل"); setEventType("الكل"); setDate(""); }}>مسح الفلاتر</button>}
          </div>
          <div className="news-grid">{filtered.map((article) => <div id={`article-${article.id}`} key={article.id}><NewsCard article={article} /></div>)}</div>
          {!filtered.length && <div className="empty">{articles.length ? "لا توجد أخبار مطابقة لهذه الفلاتر." : "لا توجد أخبار محفوظة بعد. استخدم زر تحديث الأخبار للبدء."}</div>}
        </section>
        <section className="source-monitor" aria-labelledby="source-monitor-title">
          <div className="section-heading">
            <div><span className="kicker">مراقبة الجمع</span><h2 id="source-monitor-title">حالة مصادر الأخبار</h2></div>
            <div className="source-totals"><span>{activeSourceCount} نشطة</span><span className="source-ok">{successfulSourceCount} ناجحة</span><span className={troubledSourceCount ? "source-bad" : ""}>{troubledSourceCount} متعثرة</span></div>
          </div>
          <div className="source-table-wrap">
            <table className="source-table">
              <thead><tr><th>المصدر</th><th>التصنيف</th><th>النوع</th><th>العناصر</th><th>آخر تحديث ناجح</th><th>الحالة</th></tr></thead>
              <tbody>{sourceStatuses.filter((item) => item.active).map((item) => {
                const successful = item.itemCount > 0 && Boolean(item.lastSuccess) && item.failureCount === 0;
                return <tr key={item.id}>
                  <td><a href={item.url} target="_blank" rel="noreferrer">{item.name}</a></td>
                  <td>{item.category}</td><td>{item.type === "rss" ? "RSS" : item.type === "adapter" ? "موائم" : "صفحة"}</td><td>{item.itemCount}</td>
                  <td>{item.lastSuccess ? updateFormatter.format(new Date(item.lastSuccess)) : "—"}</td>
                  <td><span className={`source-state ${successful ? "is-success" : item.failureCount ? "is-failed" : "is-pending"}`}>{successful ? "يعمل" : item.failureCount ? "متعثر" : "لم يُختبر"}</span></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        </section>
      </div>
      <footer><div className="brand"><span className="brand-mark">ر</span><strong>رادار السوق السعودي</strong></div><p>رصد محلي للسوق السعودي · للاستخدام المعلوماتي فقط</p></footer>
    </main>
  );
}
