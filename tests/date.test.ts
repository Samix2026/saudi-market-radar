import { describe, expect, it } from "vitest";
import { toRiyadhDateKey } from "@/lib/date";

describe("تاريخ الرياض", () => {
  it("ينقل الساعات الأخيرة UTC إلى اليوم التالي في الرياض", () => {
    expect(toRiyadhDateKey("2026-07-16T22:30:00.000Z")).toBe("2026-07-17");
  });
});
