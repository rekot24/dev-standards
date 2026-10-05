-- snippets/rls-tenant.sql
--
-- Row Level Security template for a multi-tenant Supabase app.
-- Put this in a migration (supabase/migrations/<timestamp>_tenancy.sql). Rename `things` to your table.
--
-- PRINCIPLES
--  1. Enable RLS in the SAME migration that creates the table. No policy = no access (the safe default).
--  2. Least privilege: GRANT only what policies need. Grant `anon` nothing unless a table is intentionally public.
--     Do NOT use blanket "GRANT ALL ... TO anon" to silence permission errors — fix the policy instead.
--  3. Wrap auth.uid() as (select auth.uid()) so Postgres evaluates it once per query, not once per row.
--  4. Entitlements (plan tier) are writable ONLY by the service role. Tenants may read, never write.
--  5. Verify current Supabase docs/advisor when starting a project; defaults and key formats change.

-- ---------------------------------------------------------------- tenancy core
create table tenants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table tenant_members (
  tenant_id uuid not null references tenants(id)    on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'owner' check (role in ('owner','admin','member')),
  primary key (tenant_id, user_id)
);

alter table tenants        enable row level security;
alter table tenant_members enable row level security;

-- Helper: is the signed-in user a member of this tenant?
-- SECURITY DEFINER so the policy can read tenant_members without recursive RLS; empty search_path for safety.
create or replace function public.is_tenant_member(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tenant_members m
    where m.tenant_id = target and m.user_id = (select auth.uid())
  );
$$;
revoke all     on function public.is_tenant_member(uuid) from public, anon;
grant  execute on function public.is_tenant_member(uuid) to authenticated;

-- Helper: does the tenant's plan meet a minimum tier? (ordering must match PLAN_RANK in constants.ts)
create or replace function public.tenant_has_plan(target uuid, min_tier text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select array_position(array['free','pro','team'], p.plan_tier) >= array_position(array['free','pro','team'], min_tier)
       from public.tenant_plans p where p.tenant_id = target),
    min_tier = 'free');
$$;
revoke all     on function public.tenant_has_plan(uuid, text) from public, anon;
grant  execute on function public.tenant_has_plan(uuid, text) to authenticated;

create policy "see own memberships" on tenant_members for select to authenticated using (user_id = (select auth.uid()));
create policy "see own tenants"     on tenants        for select to authenticated using (public.is_tenant_member(id));
grant select on tenants, tenant_members to authenticated;

-- ---------------------------------------------------------------- an ordinary tenant-owned table
create table things (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  name       text not null,
  status     text not null default 'draft',
  created_at timestamptz not null default now()
);
create index things_tenant_idx on things (tenant_id, created_at desc);   -- policies filter on tenant_id: index it
alter table things enable row level security;

create policy things_select on things for select to authenticated using (public.is_tenant_member(tenant_id));
create policy things_insert on things for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy things_update on things for update to authenticated
  using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy things_delete on things for delete to authenticated using (public.is_tenant_member(tenant_id));
grant select, insert, update, delete on things to authenticated;

-- ---------------------------------------------------------------- plan-gated table (server-side enforcement)
-- A hidden button is not a lock. This policy blocks inserts for tenants below the 'pro' plan.
-- create policy premium_insert on premium_things for insert to authenticated
--   with check (public.is_tenant_member(tenant_id) and public.tenant_has_plan(tenant_id, 'pro'));

-- ---------------------------------------------------------------- settings, plans, logs
alter table tenant_settings enable row level security;
create policy settings_select on tenant_settings for select to authenticated using (public.is_tenant_member(tenant_id));
create policy settings_insert on tenant_settings for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy settings_update on tenant_settings for update to authenticated
  using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
grant select, insert, update on tenant_settings to authenticated;

alter table tenant_plans enable row level security;
create policy plans_select on tenant_plans for select to authenticated using (public.is_tenant_member(tenant_id));
grant select on tenant_plans to authenticated;      -- no insert/update/delete: the service role (billing webhook) writes plans

alter table app_logs enable row level security;
create policy logs_insert on app_logs for insert to authenticated with check (public.is_tenant_member(tenant_id));
grant insert on app_logs to authenticated;          -- insert-only from the client; read logs from the dashboard/SQL editor

-- ---------------------------------------------------------------- RLS isolation test (do this once you have 2 tenants)
-- The most valuable test in a multi-tenant app. Using pgTAP (or a Vitest test with two real signed-in users):
--   1. As user A: select from things  -> only tenant A's rows
--   2. As user A: insert into things with tenant_id = B  -> must FAIL
--   3. As user A: update/delete a tenant B row            -> must affect 0 rows
--   4. As user A: update tenant_plans                     -> must FAIL
-- Run it in CI. A policy typo here is a data breach.
