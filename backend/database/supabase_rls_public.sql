-- =====================================================================
-- LAAS Real Estate — Public (anon) read access for the frontend
-- Allows the publishable/anon key to SELECT listing data directly
-- from the browser via PostgREST. Writes stay on the Express backend.
-- =====================================================================

alter table properties     enable row level security;
alter table land_sales     enable row level security;
alter table house_sales    enable row level security;
alter table house_rentals  enable row level security;

grant usage on schema public to anon;

grant select on properties    to anon;
grant select on land_sales    to anon;
grant select on house_sales   to anon;
grant select on house_rentals to anon;

drop policy if exists "laas_public_select_properties"     on properties;
drop policy if exists "laas_public_select_land_sales"     on land_sales;
drop policy if exists "laas_public_select_house_sales"    on house_sales;
drop policy if exists "laas_public_select_house_rentals"  on house_rentals;

create policy "laas_public_select_properties"     on properties    for select to anon using (true);
create policy "laas_public_select_land_sales"     on land_sales    for select to anon using (true);
create policy "laas_public_select_house_sales"    on house_sales   for select to anon using (true);
create policy "laas_public_select_house_rentals"  on house_rentals for select to anon using (true);