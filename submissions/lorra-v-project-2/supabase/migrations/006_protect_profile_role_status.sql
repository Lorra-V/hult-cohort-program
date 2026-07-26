-- Prevent privilege escalation via PostgREST: profiles_update_own allows
-- updating own row, but role/status must stay app/admin-controlled.
-- Non-admins get role/status silently reverted; service_role and is_admin() may change them.

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text := coalesce(auth.jwt() ->> 'role', '');
begin
  if jwt_role = 'service_role' then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  new.role := old.role;
  new.status := old.status;
  return new;
end;
$$;

drop trigger if exists profiles_protect_privileged_columns on public.profiles;
create trigger profiles_protect_privileged_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_privileged_columns();

revoke all on function public.protect_profile_privileged_columns() from public;
