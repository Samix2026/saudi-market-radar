import { cleanText } from "./text";

export function summarizeArabic(title: string, description = ""): string {
  const cleanTitle = cleanText(title);
  const cleanDescription = cleanText(description);
  if (!cleanDescription) return `يتناول الخبر ${cleanTitle}، وتتم متابعة تفاصيله وانعكاساته على السوق السعودي.`;
  const firstSentence = cleanDescription.split(/(?<=[.!؟])\s+/)[0];
  const excerpt = firstSentence.slice(0, 220).trim();
  return excerpt.endsWith(".") || excerpt.endsWith("؟") ? excerpt : `${excerpt}.`;
}
