import { NextResponse } from "next/server";
import { ensureSeedData, refreshNews } from "@/lib/pipeline";
import { getSourceStatuses, getVisibleArticles } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  ensureSeedData();
  return NextResponse.json({ articles: getVisibleArticles(), sources: getSourceStatuses() });
}

export async function POST() {
  const result = await refreshNews();
  return NextResponse.json(result, { status: result.added || !result.errors.length ? 200 : 207 });
}
