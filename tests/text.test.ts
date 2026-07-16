import { describe, expect, it } from "vitest";
import { isDuplicate, normalizeText, textSimilarity } from "@/lib/text";

describe("إزالة التكرار", () => {
  it("يوحّد أشكال الحروف العربية وعلامات الترقيم", () => {
    expect(normalizeText("إطلاقُ مَشروعٍ جديد!")).toBe("اطلاق مشروع جديد");
  });

  it("يكتشف العناوين المتطابقة بصياغة طفيفة", () => {
    expect(isDuplicate("إطلاق مشروع جديد للطاقة المتجددة في السعودية", "السعودية: إطلاق مشروع جديد للطاقة المتجددة")).toBe(true);
  });

  it("لا يخلط بين خبرين مختلفين", () => {
    expect(textSimilarity("البنوك توسع التمويل الرقمي للمنشآت", "افتتاح فندق جديد في وجهة سياحية")).toBeLessThan(0.3);
  });
});
