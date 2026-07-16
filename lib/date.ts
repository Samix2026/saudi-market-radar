const riyadhDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Riyadh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toRiyadhDateKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return riyadhDateFormatter.format(date);
}
