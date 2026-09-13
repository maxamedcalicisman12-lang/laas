const URL = 'https://ozeeeaxwrjkbxlzvxqds.supabase.co';
const KEY = 'sb_publishable_iz69aHNkPsrTwnzb10CfZw_J1MfE89s';

async function rest(path) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('json') ? await res.json() : await res.text();
  return { status: res.status, body };
}

(async () => {
  const tables = ['properties', 'land_sales', 'house_sales', 'house_rentals', 'customers', 'users'];
  for (const t of tables) {
    const { status, body } = await rest(`${t}?select=id&limit=1`);
    const n = Array.isArray(body) ? body.length : (body && body.length !== undefined ? body.length : JSON.stringify(body).slice(0, 60));
    console.log(`${t.padEnd(15)} status=${status} rows=${Array.isArray(body) ? body.length : '-'} ${status === 200 && !Array.isArray(body) ? JSON.stringify(body).slice(0, 80) : ''}`);
  }

  const { status, body } = await rest('land_sales?select=id,status,location,property_id,properties:land_sales_property_id_fkey(id,title)&status=eq.available');
  console.log('\njoin test status=', status);
  console.log(JSON.stringify(body).slice(0, 400));

  const { status: s2, body: b2 } = await rest('properties?select=id,title,type,price&type=in.(house,apartment,villa,house-sale)&status=eq.available&deleted_at=is.null&limit=5');
  console.log('\nfilter test status=', s2, 'rows=', Array.isArray(b2) ? b2.length : b2);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });