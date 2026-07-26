import { expect, test } from "@playwright/test";

const MEMBER_EMAIL = "asha@conexus.local";
const SEED_PASSWORD = process.env.DEV_ADMIN_PASSWORD || "ConexusSeed!2026";

/**
 * DB trigger protect_profile_privileged_columns must block self-promotion
 * via PostgREST even though profiles_update_own allows updating own row.
 */
test.describe("profiles role/status guard", () => {
  test("member cannot escalate own role to admin via PostgREST", async ({
    request,
  }) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    test.skip(!url || !anon, "Supabase env not loaded into Playwright");

    const signIn = await request.post(
      `${url}/auth/v1/token?grant_type=password`,
      {
        headers: {
          apikey: anon!,
          "Content-Type": "application/json",
        },
        data: {
          email: MEMBER_EMAIL,
          password: SEED_PASSWORD,
        },
      },
    );
    expect(signIn.ok(), `seed member sign-in failed: ${signIn.status()}`).toBe(
      true,
    );
    const session = (await signIn.json()) as {
      access_token: string;
      user: { id: string };
    };
    expect(session.access_token).toBeTruthy();
    expect(session.user?.id).toBeTruthy();

    const patch = await request.patch(
      `${url}/rest/v1/profiles?id=eq.${session.user.id}`,
      {
        headers: {
          apikey: anon!,
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        data: { role: "admin" },
      },
    );

    // Escalation must not stick: either request fails, or role stays member.
    if (patch.ok()) {
      const rows = (await patch.json()) as Array<{ role: string }>;
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows[0]?.role).not.toBe("admin");
      expect(rows[0]?.role).toBe("member");
    } else {
      expect([401, 403]).toContain(patch.status());
    }

    const verify = await request.get(
      `${url}/rest/v1/profiles?id=eq.${session.user.id}&select=role`,
      {
        headers: {
          apikey: anon!,
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );
    expect(verify.ok()).toBe(true);
    const verified = (await verify.json()) as Array<{ role: string }>;
    expect(verified[0]?.role).toBe("member");
  });
});
