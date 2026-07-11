-- Migration: International package support
-- Adds trip_type to packages and broadens the locations.region constraint
-- to allow international destinations.

-- 1. Drop the India-only region check on locations
alter table public.locations
  drop constraint if exists locations_region_check;

-- 2. Add broader region values (international + existing domestic)
alter table public.locations
  add constraint locations_region_check check (region in (
    -- India (domestic)
    'North India', 'South India', 'East India', 'West India', 'Central India',
    -- International
    'Southeast Asia', 'East Asia', 'South Asia',
    'Middle East', 'Central Asia',
    'Europe', 'Eastern Europe',
    'Africa', 'North Africa',
    'North America', 'South America', 'Central America',
    'Oceania',
    'Arctic / Antarctica'
  ));

-- 3. Make state optional for international locations (e.g. city-states, small countries)
alter table public.locations
  alter column state drop not null;

-- 4. Add trip_type enum and column to packages
do $$
begin
  if not exists (select 1 from pg_type where typname = 'trip_type') then
    create type public.trip_type as enum ('domestic', 'international');
  end if;
end $$;

alter table public.packages
  add column if not exists trip_type public.trip_type not null default 'domestic';

-- 5. Index for quick trip_type filtering
create index if not exists packages_trip_type_idx on public.packages (trip_type);

-- 6. Update FTS trigger so trip_type is included in full-text search weight
--    (locations already included via location join — no change needed there)
