const URL = 'https://ozeeeaxwrjkbxlzvxqds.supabase.co';
const KEY = 'sb_publishable_iz69aHNkPsrTwnzb10CfZw_J1MfE89s';

async function hit(path, method = 'GET', body) {
  const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${URL}${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json() : await res.text();
  return { status: res.status, data };
}

(async () => {
  console.log('GET /rest/v1/            ->', JSON.stringify(await hit('/rest/v1/')));
  console.log('GET /rest/v1/properties  ->', JSON.stringify(await hit('/rest/v1/properties?select=id&limit=1')));
  console.log('GET /auth/v1/settings    ->', JSON.stringify(await hit('/auth/v1/settings')));
  console.log('GET /storage/v1/bucket   ->', JSON.stringify(await hit('/storage/v1/bucket')));
  console.log('POST /auth/v1/token?grant_type=user_email  ->', JSON.stringify(await hit('/auth/v1/token?grant_type=user_email', 'POST', { email: 'x@x.com', password: 'x' })));
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });