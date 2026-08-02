/** Public builder URL — uses stored profile.slug (never raw id). */
export function builderPath(slug: string): string {
  return `/builders/${slug}`;
}

export function projectPath(slug: string): string {
  return `/projects/${slug}`;
}

export function partnerInterestPath(options?: {
  participantId?: string;
  projectId?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.participantId) params.set("participant", options.participantId);
  if (options?.projectId) params.set("project", options.projectId);
  const qs = params.toString();
  return qs ? `/partners?${qs}` : "/partners";
}
