import type { IncomingArticle } from "./types";

const now = Date.now();
const day = 86_400_000;

export const seedArticles: IncomingArticle[] = [
  { title: "إطلاق صندوق جديد لدعم الشركات التقنية السعودية", source: "بيانات تجريبية", publishedAt: new Date(now - 1_200_000).toISOString(), description: "أُعلن عن صندوق يركز على تمويل الشركات التقنية في مراحل النمو وتعزيز توسعها محليًا.", url: "https://example.com/tech-fund" },
  { title: "البنوك السعودية توسع حلول التمويل الرقمي للمنشآت", source: "بيانات تجريبية", publishedAt: new Date(now - 3_600_000).toISOString(), description: "تعمل بنوك محلية على توسيع منتجات التمويل الرقمي الموجهة للمنشآت الصغيرة والمتوسطة.", url: "https://example.com/banks" },
  { title: "مشروع طاقة متجددة يضيف قدرة إنتاجية جديدة", source: "بيانات تجريبية", publishedAt: new Date(now - 7_200_000).toISOString(), description: "شهد قطاع الطاقة إطلاق مشروع للطاقة المتجددة ضمن خطط تنويع مزيج إنتاج الكهرباء.", url: "https://example.com/energy" },
  { title: "نمو تراخيص مرافق الضيافة في وجهات سياحية", source: "بيانات تجريبية", publishedAt: new Date(now - 12_000_000).toISOString(), description: "سجلت تراخيص الفنادق ومرافق الضيافة نموًا مع زيادة النشاط السياحي وتوسع الوجهات.", url: "https://example.com/tourism" },
  { title: "اتفاقية لتطوير منطقة لوجستية قرب ميناء سعودي", source: "بيانات تجريبية", publishedAt: new Date(now - 18_000_000).toISOString(), description: "تستهدف الاتفاقية رفع كفاءة الشحن والتخزين وربط سلاسل الإمداد بالأسواق الإقليمية.", url: "https://example.com/logistics" },
  { title: "توسع في تصنيع الأدوية محليًا", source: "بيانات تجريبية", publishedAt: new Date(now - day).toISOString(), description: "أعلنت شركة صحية توسعة منشأة لتصنيع الأدوية بهدف زيادة المحتوى المحلي وتحسين الإمدادات.", url: "https://example.com/health" },
  { title: "إطلاق مشروع تطوير عقاري متعدد الاستخدامات", source: "بيانات تجريبية", publishedAt: new Date(now - day * 2).toISOString(), description: "يشمل المشروع وحدات سكنية وتجارية وخدمات في إحدى المدن السعودية الرئيسية.", url: "https://example.com/real-estate" },
  { title: "مصنع جديد لمعالجة المعادن يبدأ التشغيل التجريبي", source: "بيانات تجريبية", publishedAt: new Date(now - day * 3).toISOString(), description: "بدأ مصنع لمعالجة المعادن مرحلة التشغيل التجريبي ضمن جهود توطين سلاسل القيمة الصناعية.", url: "https://example.com/mining" },
  { title: "منصة تجزئة سعودية توسع شبكة متاجرها", source: "بيانات تجريبية", publishedAt: new Date(now - day * 4).toISOString(), description: "تعتزم منصة تعمل في قطاع التجزئة افتتاح متاجر جديدة وتطوير قنوات التجارة الإلكترونية.", url: "https://example.com/retail" },
  { title: "شراكة لتطوير حلول ذكاء اصطناعي باللغة العربية", source: "بيانات تجريبية", publishedAt: new Date(now - day * 5).toISOString(), description: "تستهدف الشراكة بناء حلول ذكاء اصطناعي عربية للاستخدام في خدمات الشركات والجهات المحلية.", url: "https://example.com/ai" },
];
