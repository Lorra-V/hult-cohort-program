import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { nextAvailableSlug } from "@/lib/slug";

/**
 * Allocate a unique profile slug from a display name.
 * Uses the service role so unpublished rows with existing slugs are visible.
 */
export async function allocateUniqueProfileSlug(
  name: string | null | undefined,
  excludeProfileId?: string,
): Promise<string> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select("id, slug")
    .not("slug", "is", null);

  if (error) throw new Error(error.message);

  const taken = new Set<string>();
  for (const row of data ?? []) {
    if (excludeProfileId && row.id === excludeProfileId) continue;
    if (typeof row.slug === "string" && row.slug) taken.add(row.slug);
  }

  return nextAvailableSlug(name, taken);
}
