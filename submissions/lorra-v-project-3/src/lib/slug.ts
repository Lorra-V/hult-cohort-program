/** Turn a display name into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Base slug for a profile name; never empty. */
export function profileSlugBase(name: string | null | undefined): string {
  return slugify(name || "builder") || "builder";
}

/**
 * Pick the first unused slug from a set of taken slugs.
 * Collision order: base, base-2, base-3, …
 */
export function nextAvailableSlug(
  name: string | null | undefined,
  taken: Iterable<string>,
): string {
  const takenSet = taken instanceof Set ? taken : new Set(taken);
  const base = profileSlugBase(name);
  let candidate = base;
  let n = 1;
  while (takenSet.has(candidate)) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function looksLikeUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function initialsFromName(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}
