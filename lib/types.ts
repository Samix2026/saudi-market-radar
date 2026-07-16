export const SECTORS = [
  "الاستثمار",
  "البنوك",
  "الطاقة",
  "التقنية والذكاء الاصطناعي",
  "العقار",
  "التجزئة",
  "السياحة",
  "الصحة",
  "الصناعة والتعدين",
  "اللوجستيات",
] as const;

export type Sector = (typeof SECTORS)[number];

export const EVENT_TYPES = [
  "نتائج مالية", "توزيعات", "عقود", "استحواذ", "اندماج", "زيادة رأس المال",
  "تخفيض رأس المال", "مشروع", "جمعية", "إفصاح", "طرح", "تعيين",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type NewsItem = {
  id: number;
  title: string;
  source: string;
  publishedAt: string;
  sector: Sector;
  summary: string;
  businessImpact: string;
  url: string;
  importance: number;
  createdAt: string;
  companyName?: string;
  tradingSymbol?: string;
  companySector?: string;
  eventType?: EventType;
  isOfficial?: boolean;
};

export type IncomingArticle = Omit<NewsItem, "id" | "createdAt" | "sector" | "summary" | "businessImpact" | "importance"> & {
  description?: string;
};

export type SourceStatus = {
  id: string;
  name: string;
  category: "رسمي" | "اقتصادي" | "شركات" | "تقني" | "قطاعي";
  type: "rss" | "page" | "adapter";
  url: string;
  active: boolean;
  lastSuccess: string | null;
  lastFailure: string | null;
  failureCount: number;
  itemCount: number;
  latestPublishedAt: string | null;
  lastError: string | null;
};
