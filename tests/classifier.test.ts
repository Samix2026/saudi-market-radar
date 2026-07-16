import { describe, expect, it } from "vitest";
import { classifySector, scoreImportance } from "@/lib/classifier";

describe("تصنيف الأخبار", () => {
  it("يصنف أخبار النفط في الطاقة", () => expect(classifySector("أرامكو تعلن مشروع نفط وغاز جديد")).toBe("الطاقة"));
  it("يصنف الذكاء الاصطناعي في التقنية", () => expect(classifySector("إطلاق منصة ذكاء اصطناعي عربية وبيانات سحابية")).toBe("التقنية والذكاء الاصطناعي"));
  it("يصنف جمع بنك في قطاع البنوك", () => expect(classifySector("البنوك السعودية توسع التمويل الرقمي للمنشآت")).toBe("البنوك"));
  it("يصنف التصنيع الدوائي في الصحة", () => expect(classifySector("توسع شركة صحية في تصنيع الأدوية محليًا")).toBe("الصحة"));
  it("يحصر الأهمية بين 1 و5", () => expect(scoreImportance("اتفاقية بمليار لإطلاق مشروع ونمو الإنتاج")).toBe(5));
});
