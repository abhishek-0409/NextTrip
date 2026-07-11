-- ============================================================================
-- RLS hardening for core tables (users, companies, packages, bookings, etc.)
--
-- WHY: toureez-web / toureez-vendor-app / toureez-admin-app all embed the
-- public Supabase "anon" key in their JS bundles. That key is meant to be
-- public — authorization is supposed to come entirely from Row Level
-- Security policies evaluated against the caller's JWT. Prior to this
-- migration, only a handful of vendor/admin-workflow tables (added in
-- 20260525_vendor_admin_tables.sql and 20260610_enquiries.sql) had RLS
-- enabled. The original core tables (users, companies, packages, bookings,
-- payments, reviews, notifications, wishlists, locations, categories,
-- package_pricing, package_images, itineraries) were provisioned outside
-- version control and their RLS status is unverified — this migration
-- assumes the worst case (RLS off / no policies) and is safe to apply
-- regardless of current state, because:
--   - ALTER TABLE ... ENABLE ROW LEVEL SECURITY is idempotent (no error if
--     already enabled).
--   - Every CREATE POLICY is preceded by DROP POLICY IF EXISTS, so re-running
--     this file is also safe.
--   - The backend (toureez-backend) always writes through the
--     `service_role` key via `supabaseAdmin`, which bypasses RLS entirely —
--     so none of this changes backend behavior.
--
-- HOW TO APPLY: review this file, then run it against your project via the
-- Supabase SQL Editor (dashboard) or `supabase db push` if the CLI is linked.
-- Test as a real (non-admin) logged-in user afterwards to confirm the app
-- still works end-to-end before considering this done.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_select_admin" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "users_update_admin" on public.users;

-- Every authenticated user can read their own profile row.
create policy "users_select_own" on public.users
  for select
  using (id = auth.uid());

-- Admins can read all profiles (needed for the admin dashboard).
create policy "users_select_admin" on public.users
  for select
  using ((select role from public.users where id = auth.uid()) = 'admin');

-- A user may only ever insert a row for themselves, and only as 'traveler' —
-- this blocks the classic "sign up, then upsert role: admin" privilege
-- escalation via a raw fetch to the PostgREST API.
create policy "users_insert_own" on public.users
  for insert
  with check (id = auth.uid() and role = 'traveler');

-- A user may update their own row, but the WITH CHECK re-validates the new
-- row: role must remain whatever it already was (see trigger below for the
-- actual enforcement — WITH CHECK alone can't compare against OLD).
create policy "users_update_own" on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins can update any profile (e.g. to promote a company_owner or ban a user).
create policy "users_update_admin" on public.users
  for update
  using ((select role from public.users where id = auth.uid()) = 'admin')
  with check ((select role from public.users where id = auth.uid()) = 'admin');

-- Belt-and-suspenders: even with the policies above, block any non-admin,
-- non-service-role caller from changing their own `role` column via UPDATE.
create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.role() = 'service_role' then
      return new;
    end if;
    if (select role from public.users where id = auth.uid()) = 'admin' then
      return new;
    end if;
    raise exception 'Only admins may change a user''s role';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_role_change on public.users;
create trigger trg_prevent_self_role_change
  before update on public.users
  for each row
  execute function public.prevent_self_role_change();

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------
alter table public.companies enable row level security;

drop policy if exists "companies_select_public" on public.companies;
drop policy if exists "companies_select_owner" on public.companies;
drop policy if exists "companies_select_admin" on public.companies;

-- Verified companies are public (shown on package listings for anonymous visitors).
create policy "companies_select_public" on public.companies
  for select
  using (is_verified = true);

-- Owners can see their own company even before it's verified.
create policy "companies_select_owner" on public.companies
  for select
  using (owner_id = auth.uid());

create policy "companies_select_admin" on public.companies
  for select
  using ((select role from public.users where id = auth.uid()) = 'admin');

-- No INSERT/UPDATE/DELETE policies for anon/authenticated: company
-- creation and verification only ever happen through the backend's
-- service-role client (vendorService.ts / adminService.ts), which bypasses
-- RLS. This prevents a caller from self-verifying (`is_verified: true`) or
-- editing someone else's company directly via the anon key.

-- ---------------------------------------------------------------------------
-- locations / categories — public reference data
-- ---------------------------------------------------------------------------
alter table public.locations enable row level security;
alter table public.categories enable row level security;

drop policy if exists "locations_select_active" on public.locations;
create policy "locations_select_active" on public.locations
  for select
  using (is_active = true);

drop policy if exists "categories_select_active" on public.categories;
create policy "categories_select_active" on public.categories
  for select
  using (is_active = true);

-- ---------------------------------------------------------------------------
-- packages
-- ---------------------------------------------------------------------------
alter table public.packages enable row level security;

drop policy if exists "packages_select_active" on public.packages;
drop policy if exists "packages_select_owner" on public.packages;
drop policy if exists "packages_select_admin" on public.packages;

create policy "packages_select_active" on public.packages
  for select
  using (status = 'active');

create policy "packages_select_owner" on public.packages
  for select
  using (
    exists (
      select 1 from public.companies c
      where c.id = packages.company_id and c.owner_id = auth.uid()
    )
  );

create policy "packages_select_admin" on public.packages
  for select
  using ((select role from public.users where id = auth.uid()) = 'admin');

-- No write policies: package create/update/status changes go through
-- vendorPackageService.ts / adminService.ts using the service-role client.

-- ---------------------------------------------------------------------------
-- package_pricing / package_images / itineraries — visible whenever the
-- parent package is visible.
-- ---------------------------------------------------------------------------
alter table public.package_pricing enable row level security;
alter table public.package_images enable row level security;
alter table public.itineraries enable row level security;

drop policy if exists "package_pricing_select" on public.package_pricing;
create policy "package_pricing_select" on public.package_pricing
  for select
  using (
    exists (
      select 1 from public.packages p
      where p.id = package_pricing.package_id
        and (
          p.status = 'active'
          or exists (select 1 from public.companies c where c.id = p.company_id and c.owner_id = auth.uid())
          or (select role from public.users where id = auth.uid()) = 'admin'
        )
    )
  );

drop policy if exists "package_images_select" on public.package_images;
create policy "package_images_select" on public.package_images
  for select
  using (
    exists (
      select 1 from public.packages p
      where p.id = package_images.package_id
        and (
          p.status = 'active'
          or exists (select 1 from public.companies c where c.id = p.company_id and c.owner_id = auth.uid())
          or (select role from public.users where id = auth.uid()) = 'admin'
        )
    )
  );

drop policy if exists "itineraries_select" on public.itineraries;
create policy "itineraries_select" on public.itineraries
  for select
  using (
    exists (
      select 1 from public.packages p
      where p.id = itineraries.package_id
        and (
          p.status = 'active'
          or exists (select 1 from public.companies c where c.id = p.company_id and c.owner_id = auth.uid())
          or (select role from public.users where id = auth.uid()) = 'admin'
        )
    )
  );

-- ---------------------------------------------------------------------------
-- bookings — private to the traveler who made it and the company that owns
-- the package (plus admins). All writes go through bookingService.ts using
-- the service-role client, so no write policies are needed here.
-- ---------------------------------------------------------------------------
alter table public.bookings enable row level security;

drop policy if exists "bookings_select_own" on public.bookings;
drop policy if exists "bookings_select_company_owner" on public.bookings;
drop policy if exists "bookings_select_admin" on public.bookings;

create policy "bookings_select_own" on public.bookings
  for select
  using (user_id = auth.uid());

create policy "bookings_select_company_owner" on public.bookings
  for select
  using (
    exists (
      select 1 from public.companies c
      where c.id = bookings.company_id and c.owner_id = auth.uid()
    )
  );

create policy "bookings_select_admin" on public.bookings
  for select
  using ((select role from public.users where id = auth.uid()) = 'admin');

-- ---------------------------------------------------------------------------
-- payments — private, never queried directly by any frontend today; only
-- exists so an attacker can't dump payment records via the anon key even
-- though the app doesn't currently expose that path.
-- ---------------------------------------------------------------------------
alter table public.payments enable row level security;

drop policy if exists "payments_select_own" on public.payments;
drop policy if exists "payments_select_company_owner" on public.payments;
drop policy if exists "payments_select_admin" on public.payments;

create policy "payments_select_own" on public.payments
  for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = payments.booking_id and b.user_id = auth.uid()
    )
  );

create policy "payments_select_company_owner" on public.payments
  for select
  using (
    exists (
      select 1 from public.bookings b
      join public.companies c on c.id = b.company_id
      where b.id = payments.booking_id and c.owner_id = auth.uid()
    )
  );

create policy "payments_select_admin" on public.payments
  for select
  using ((select role from public.users where id = auth.uid()) = 'admin');

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
alter table public.reviews enable row level security;

drop policy if exists "reviews_select_published" on public.reviews;
drop policy if exists "reviews_select_own" on public.reviews;
drop policy if exists "reviews_select_admin" on public.reviews;

create policy "reviews_select_published" on public.reviews
  for select
  using (is_published = true);

create policy "reviews_select_own" on public.reviews
  for select
  using (user_id = auth.uid());

create policy "reviews_select_admin" on public.reviews
  for select
  using ((select role from public.users where id = auth.uid()) = 'admin');

-- No write policies: review creation/moderation goes through
-- reviewService.ts using the service-role client (which also verifies the
-- reviewer actually completed the booking before allowing a review).

-- ---------------------------------------------------------------------------
-- notifications — strictly private to the recipient.
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_update_own_read" on public.notifications;

create policy "notifications_select_own" on public.notifications
  for select
  using (user_id = auth.uid());

-- Allow a user to mark their own notifications read/unread directly, since
-- this is a low-risk, purely cosmetic field.
create policy "notifications_update_own_read" on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- wishlists
-- ---------------------------------------------------------------------------
alter table public.wishlists enable row level security;

drop policy if exists "wishlists_select_own" on public.wishlists;

create policy "wishlists_select_own" on public.wishlists
  for select
  using (user_id = auth.uid());

-- No write policy: wishlist add/remove goes through wishlistService.ts
-- using the service-role client.
