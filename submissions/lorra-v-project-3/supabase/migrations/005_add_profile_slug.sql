-- Profile public URLs: /builders/<slug> instead of /builders/<uuid>
-- Paste into Supabase SQL Editor. Nullable initially; backfill published rows.

alter table public.profiles
  add column if not exists slug text;

-- UNIQUE allows multiple NULLs in PostgreSQL.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_slug_key'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_slug_key unique (slug);
  end if;
end $$;

create index if not exists profiles_slug_idx on public.profiles (slug)
  where slug is not null;

-- Mirror lib/slug.ts slugify for ASCII names (trim, lower, non-alnum → hyphen, trim hyphens, max 80).
-- Accented names: PostgreSQL lacks JS NFKD by default; unaccent is used when available.
create or replace function public.slugify_profile_name(input text)
returns text
language plpgsql
immutable
as $$
declare
  s text;
begin
  s := trim(coalesce(input, ''));
  if s = '' then
    return 'builder';
  end if;

  begin
    s := extensions.unaccent(s);
  exception
    when undefined_function then
      null;
    when invalid_schema_name then
      null;
  end;

  s := lower(s);
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := trim(both '-' from s);
  s := left(s, 80);

  if s = '' then
    return 'builder';
  end if;

  return s;
end;
$$;

-- Backfill published profiles only (oldest first so they keep the bare slug on collisions).
do $$
declare
  r record;
  base text;
  candidate text;
  n int;
begin
  for r in
    select id, name
    from public.profiles
    where profile_status = 'published'
      and (slug is null or slug = '')
    order by created_at asc, id asc
  loop
    base := public.slugify_profile_name(r.name);
    candidate := base;
    n := 1;

    while exists (
      select 1 from public.profiles p where p.slug = candidate
    ) loop
      n := n + 1;
      candidate := base || '-' || n::text;
    end loop;

    update public.profiles
    set slug = candidate
    where id = r.id;
  end loop;
end $$;
