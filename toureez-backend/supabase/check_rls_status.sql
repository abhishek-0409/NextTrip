-- Read-only diagnostic: run this in the Supabase SQL Editor BEFORE and AFTER
-- applying migrations/20260710_rls_hardening.sql to see current RLS state.
-- Does not modify anything.

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  coalesce(p.policy_count, 0) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join (
  select tablename, count(*) as policy_count
  from pg_policies
  where schemaname = 'public'
  group by tablename
) p on p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind = 'r'
order by rls_enabled asc, table_name;
