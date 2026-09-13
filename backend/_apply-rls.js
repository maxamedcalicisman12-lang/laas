const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const cs = 'postgresql://postgres.ozeeeaxwrjkbxlzvxqds:q-y%40%2329Xv4%3Fa2X5@aws-0-eu-west-2.pooler.supabase.com:5432/postgres';
const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
(async () => {
  await client.connect();
  const sql = fs.readFileSync(path.join(__dirname, 'database', 'supabase_rls_public.sql'), 'utf8');
  await client.query(sql);
  console.log('RLS policies applied');
  const r = await client.query(`select tablename, policyname, roles, cmd from pg_policies where schemaname='public' order by tablename`);
  for (const p of r.rows) console.log(`${p.tablename} :: ${p.policyname} :: ${p.roles.join(',')} :: ${p.cmd}`);
  await client.end();
})();