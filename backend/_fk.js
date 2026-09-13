const { Client } = require('pg');
const cs = 'postgresql://postgres.ozeeeaxwrjkbxlzvxqds:q-y%40%2329Xv4%3Fa2X5@aws-0-eu-west-2.pooler.supabase.com:5432/postgres';
const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
(async () => {
  await client.connect();
  const r = await client.query(
    `select tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name as ref_table, ccu.column_name as ref_col
     from information_schema.table_constraints tc
     join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
     join information_schema.constraint_column_usage ccu on tc.constraint_name = ccu.constraint_name
     where tc.constraint_type = 'FOREIGN KEY' order by tc.table_name`
  );
  for (const row of r.rows) console.log(`${row.constraint_name} :: ${row.table_name}.${row.column_name} -> ${row.ref_table}.${row.ref_col}`);
  await client.end();
})();