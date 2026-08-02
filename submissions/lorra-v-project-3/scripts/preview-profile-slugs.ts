/**
 * Preview slugs the migration/publish path will assign for published profiles.
 * Uses the anon key (published profiles only). Run after or before migration.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { nextAvailableSlug } from "../src/lib/slug";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) throw new Error("Missing .env.local");
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Missing Supabase env");

  const sb = createClient(url, anon);

  // Prefer stored slug once migration has run; otherwise compute expected.
  let rows: {
    id: string;
    name: string | null;
    created_at: string;
    slug?: string | null;
  }[] = [];

  const withSlug = await sb
    .from("profiles")
    .select("id, name, slug, created_at")
    .eq("profile_status", "published")
    .order("created_at", { ascending: true });

  if (!withSlug.error && withSlug.data) {
    rows = withSlug.data;
  } else {
    const without = await sb
      .from("profiles")
      .select("id, name, created_at")
      .eq("profile_status", "published")
      .order("created_at", { ascending: true });
    if (without.error) throw without.error;
    rows = without.data ?? [];
  }

  const taken = new Set<string>(
    rows.map((r) => r.slug).filter((s): s is string => Boolean(s)),
  );
  console.log(`Published profiles: ${rows.length}\n`);
  console.log("slug\tname\tid");
  for (const row of rows) {
    let slug = row.slug ?? null;
    if (!slug) {
      slug = nextAvailableSlug(row.name, taken);
      taken.add(slug);
    }
    console.log(`${slug}\t${row.name ?? "(no name)"}\t${row.id}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
