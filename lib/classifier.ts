import type { Sector } from "./types";
import { normalizeText } from "./text";

const KEYWORDS: Record<Sector, string[]> = {
  "الاستثمار": ["استثمار", "صندوق", "تمويل", "سوق مالي", "صفقه", "اكتتاب", "investment", "fund"],
  "البنوك": ["بنك", "بنوك", "البنك", "البنوك", "مصرف", "مصرفي", "ائتمان", "فائده", "التمويل الرقمي", "تمويل المنشات", "bank", "lending"],
  "الطاقة": ["طاقه", "نفط", "غاز", "ارامكو", "كهرباء", "متجدد", "oil", "energy"],
  "التقنية والذكاء الاصطناعي": ["تقنيه", "ذكاء اصطناعي", "رقمي", "برمجيات", "بيانات", "سحابي", "ai", "technology"],
  "العقار": ["عقار", "اسكان", "اراضي", "مساكن", "تطوير عقاري", "real estate"],
  "التجزئة": ["تجزئه", "متاجر", "مبيعات", "مستهلك", "تجاره الكترونيه", "retail"],
  "السياحة": ["سياحه", "زوار", "فندق", "ضيافه", "ترفيه", "tourism", "hotel"],
  "الصحة": ["صحه", "صحي", "مستشفي", "دواء", "ادويه", "طبي", "رعايه صحيه", "health", "pharma"],
  "الصناعة والتعدين": ["صناعه", "تعدين", "مصنع", "معادن", "انتاج", "manufacturing", "mining"],
  "اللوجستيات": ["لوجستي", "شحن", "ميناء", "نقل", "طيران", "سلاسل الامداد", "logistics", "shipping"],
};

export function classifySector(text: string): Sector {
  const normalized = normalizeText(text);
  let best: Sector = "الاستثمار";
  let bestScore = 0;
  for (const [sector, words] of Object.entries(KEYWORDS) as [Sector, string[]][]) {
    const score = words.reduce((total, word) => total + (normalized.includes(normalizeText(word)) ? 1 : 0), 0);
    if (score > bestScore) {
      best = sector;
      bestScore = score;
    }
  }
  return best;
}

export function scoreImportance(text: string): number {
  const normalized = normalizeText(text);
  const signals = ["مليار", "اتفاقيه", "اطلاق", "نمو", "استحواذ", "تنظيم", "وزاره", "صندوق الاستثمارات", "billion"];
  const score = 2 + signals.filter((signal) => normalized.includes(normalizeText(signal))).length;
  return Math.max(1, Math.min(5, score));
}

export function businessImpactFor(sector: Sector, importance: number): string {
  const impacts: Record<Sector, string> = {
    "الاستثمار": "قد يؤثر في تدفقات رأس المال وفرص الشراكات والتمويل في السوق السعودي.",
    "البنوك": "يعكس تحولات محتملة في الائتمان والسيولة وتكلفة التمويل للشركات.",
    "الطاقة": "قد ينعكس على تكاليف التشغيل وسلاسل الإمداد والمشروعات المرتبطة بالطاقة.",
    "التقنية والذكاء الاصطناعي": "يفتح فرصًا للتحول الرقمي ورفع الكفاءة وتطوير منتجات وخدمات جديدة.",
    "العقار": "يشير إلى تغير في الطلب أو المعروض والفرص المتاحة للمطورين والممولين.",
    "التجزئة": "يوضح اتجاهات إنفاق المستهلكين والقنوات البيعية والمنافسة في السوق.",
    "السياحة": "قد يدعم الطلب على الضيافة والترفيه والخدمات المرتبطة بالزوار.",
    "الصحة": "يرتبط بالطلب على الرعاية والتقنيات الطبية وفرص مقدمي الخدمات.",
    "الصناعة والتعدين": "قد يخلق طلبًا صناعيًا وفرصًا للموردين والتصنيع المحلي.",
    "اللوجستيات": "يؤثر في حركة التجارة وتكاليف النقل وكفاءة سلاسل الإمداد.",
  };
  return `${impacts[sector]} مستوى الأهمية المرصود: ${importance} من 5.`;
}
