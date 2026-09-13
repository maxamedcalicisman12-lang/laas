const { Client } = require('pg');
const cs = 'postgresql://postgres.ozeeeaxwrjkbxlzvxqds:q-y%40%2329Xv4%3Fa2X5@aws-0-eu-west-2.pooler.supabase.com:5432/postgres';
const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
(async () => {
  await client.connect();
  const r = await client.query(`select tablename, relrowsecurity as rls, relforcerowsecurity as force_rls
    from pg_class c join pg_tables t on c.relname = t.tablename
    where t.schemaname='public' order by tablename`);
  console.log('TABLE            RLS  FORCE');
  for (const row of r.rows) console.log(`${row.tablename.padEnd(17)} ${row.rls}${row.rls?'    ':'    '} ${row.force_rls}`);
  const policies = await client.query(`select tablename, policyname, permissive, roles, cmd, qual from pg_policies where schemaname='public' order by tablename`);
  console.log('\nPOLICIES:', policies.rowCount, policies.rows);
  const roles = await client.query(`select rolname from pg_roles where rolname in ('anon','authenticated','service_role','postgres') order by rolname`);
  console.log('\nROLES:', roles.rows.map(r=>r.rolname).join(', '));
  await client.end();
})();