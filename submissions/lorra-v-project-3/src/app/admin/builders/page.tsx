import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireAdmin } from "@/lib/auth/session";
import {
  formatExactTimestamp,
  formatRelativeTime,
} from "@/lib/format-relative-time";
import { builderPath } from "@/lib/paths";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, ProfileStatus } from "@/lib/types/profile";

const PROFILE_STATUS_LABELS: Record<ProfileStatus, string> = {
  incomplete: "Incomplete",
  published: "Published",
  unpublished: "Unpublished",
};

function statusTone(
  status: ProfileStatus,
): "builders" | "coral" | "muted" {
  if (status === "published") return "builders";
  if (status === "incomplete") return "coral";
  return "muted";
}

type BuilderRow = Pick<
  Profile,
  "id" | "slug" | "name" | "email" | "profile_status" | "created_at"
>;

export default async function AdminBuildersPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select("id, slug, name, email, profile_status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Builders
        </h1>
        <p role="alert" className="text-sm text-danger">
          {error.message}
        </p>
      </div>
    );
  }

  const builders = (data ?? []) as BuilderRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Builders
        </h1>
        <p className="mt-2 text-foreground-muted">
          All cohort profiles, newest first ({builders.length}).
        </p>
      </div>

      {builders.length === 0 ? (
        <EmptyState
          title="No builders yet"
          description="Profiles appear here when participants sign up."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-background-muted text-xs uppercase tracking-[0.12em] text-foreground-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {builders.map((builder) => {
                const exact = formatExactTimestamp(builder.created_at);
                const publicHref =
                  builder.profile_status === "published" && builder.slug
                    ? builderPath(builder.slug)
                    : null;
                return (
                  <tr key={builder.id} className="align-top">
                    <td className="px-4 py-3 font-medium">
                      {publicHref ? (
                        <Link
                          href={publicHref}
                          className="hover:text-accent-coral"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {builder.name || "—"}
                        </Link>
                      ) : (
                        builder.name || "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {builder.email}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(builder.profile_status)}>
                        {PROFILE_STATUS_LABELS[builder.profile_status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground-muted">
                      {builder.slug || "—"}
                    </td>
                    <td
                      className="px-4 py-3 whitespace-nowrap"
                      title={exact}
                    >
                      <p>{formatRelativeTime(builder.created_at)}</p>
                      <p className="text-xs text-foreground-muted">{exact}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
