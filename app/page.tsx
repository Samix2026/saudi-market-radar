import { Dashboard } from "@/components/dashboard";
import { ensureSeedData } from "@/lib/pipeline";
import { getSourceStatuses, getVisibleArticles } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function Home() {
  ensureSeedData();
  return <Dashboard initialArticles={getVisibleArticles()} initialSources={getSourceStatuses()} />;
}
