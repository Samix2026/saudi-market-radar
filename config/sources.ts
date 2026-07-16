export type SourceCategory = "رسمي" | "اقتصادي" | "شركات" | "تقني" | "قطاعي";
export type SourceType = "rss" | "page" | "adapter";

type HtmlConfig = {
  itemSelector?: string;
  linkSelector: string;
  titleSelector?: string;
  dateSelector?: string;
  descriptionSelector?: string;
  resolveDetails?: boolean;
};

export type NewsSource = {
  id: string;
  name: string;
  url: string;
  active: boolean;
  language: "ar" | "en";
  category: SourceCategory;
  type: SourceType;
  html?: HtmlConfig;
  dateFromUrl?: "mc-news";
};

/** لا يُفعّل أي مصدر هنا قبل التحقق من محتواه الفعلي وحداثة تواريخه. */
export const newsSources: NewsSource[] = [
  {
    id: "saudi-exchange-announcements",
    name: "تداول السعودية",
    url: "https://www.saudiexchange.sa/wps/portal/saudiexchange/newsandreports/issuer-news/issuer-announcements?locale=ar&page=1",
    active: true,
    language: "ar",
    category: "شركات",
    type: "adapter",
  },
  {
    id: "alwatan-economy",
    name: "الوطن - اقتصاد",
    url: "https://www.alwatan.com.sa/rssFeed/4",
    active: true,
    language: "ar",
    category: "اقتصادي",
    type: "rss",
  },
  {
    id: "sfda",
    name: "هيئة الغذاء والدواء",
    url: "https://www.sfda.gov.sa/ar/news.xml",
    active: true,
    language: "ar",
    category: "قطاعي",
    type: "rss",
  },
  {
    id: "okaz-economy",
    name: "عكاظ - اقتصاد",
    url: "https://www.okaz.com.sa/rssFeed/4",
    active: true,
    language: "ar",
    category: "اقتصادي",
    type: "rss",
  },
  {
    id: "alriyadh-economy",
    name: "الرياض - اقتصاد",
    url: "https://alriyadh.com/section.news.econ.xml",
    active: true,
    language: "ar",
    category: "اقتصادي",
    type: "rss",
  },
  {
    id: "moh-news",
    name: "وزارة الصحة",
    url: "https://www.moh.gov.sa/_Layouts/moh/RssGenerator.aspx?WebSiteUrl=/Ministry/MediaCenter/News/&ListUrl=/Ministry/MediaCenter/News/Pages/&ViewName=RSSView&RssTitle=&RssDescription=&DescriptionField=BriefDesc",
    active: true,
    language: "ar",
    category: "رسمي",
    type: "rss",
  },
  {
    id: "mc-news",
    name: "وزارة التجارة",
    url: "https://mc.gov.sa/ar/Pages/RSSFeed.aspx",
    active: true,
    language: "ar",
    category: "رسمي",
    type: "rss",
    dateFromUrl: "mc-news",
  },
  {
    id: "mim-news",
    name: "وزارة الصناعة والثروة المعدنية",
    url: "https://www.mim.gov.sa/ar/media-center/news",
    active: true,
    language: "ar",
    category: "قطاعي",
    type: "page",
    html: {
      itemSelector: "article",
      linkSelector: "a[href*='/media-center/news/']",
      titleSelector: "h3",
      dateSelector: "time[datetime]",
    },
  },
  {
    id: "misa-news",
    name: "وزارة الاستثمار",
    url: "https://misa.gov.sa/ar/media-center/",
    active: true,
    language: "ar",
    category: "رسمي",
    type: "page",
    html: {
      linkSelector: "a[href*='/ar/news/']",
      resolveDetails: true,
    },
  },
];
