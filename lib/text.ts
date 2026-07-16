const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const HTML_TAGS = /<[^>]*>/g;

export function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function cleanText(value: string): string {
  return decodeEntities(value)
    .replace(HTML_TAGS, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeText(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string): Set<string> {
  return new Set(normalizeText(value).split(" ").filter((word) => word.length > 2));
}

export function textSimilarity(first: string, second: string): number {
  const a = tokens(first);
  const b = tokens(second);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((word) => b.has(word)).length;
  return intersection / (a.size + b.size - intersection);
}

export function isDuplicate(first: string, second: string, threshold = 0.55): boolean {
  const a = normalizeText(first);
  const b = normalizeText(second);
  if (a === b) return true;
  if (a.length > 20 && (a.includes(b) || b.includes(a))) return true;
  return textSimilarity(a, b) >= threshold;
}
