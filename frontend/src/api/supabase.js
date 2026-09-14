import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in frontend/.env');
}

export const supabase = createClient(url, anonKey);

export function parseImages(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

// Mirrors backend/src/controllers/publicController.js fetchAvailable()
const MODULES = {
  house_sale: {
    key: 'house_sales',
    fk: 'house_sales_property_id_fkey',
    typeList: ['house', 'apartment', 'villa', 'house-sale'],
    saleCols: ['sale_price', 'commission', 'sale_date'],
  },
  house_rental: {
    key: 'house_rentals',
    fk: 'house_rentals_property_id_fkey',
    typeList: ['house-rental'],
    saleCols: ['rent_amount', 'deposit', 'start_date', 'end_date'],
  },
  land_sale: {
    key: 'land_sales',
    fk: 'land_sales_property_id_fkey',
    typeList: ['land', 'land-sale'],
    saleCols: ['sale_price', 'commission', 'meters'],
  },
};

function standaloneSaleCols(cfg, price) {
  if (cfg.key === 'house_rentals') {
    return { rent_amount: price, deposit: null, start_date: null, end_date: null };
  }
  return {
    sale_price: price,
    commission: null,
    sale_date: null,
    ...(cfg.key === 'land_sales' ? { meters: null } : {}),
  };
}

function propertyShape(p) {
  return {
    title: p?.title ?? null,
    description: p?.description ?? null,
    property_type: p?.type ?? null,
    property_location: p?.location ?? null,
    address: p?.address ?? null,
    property_price: p?.price ?? null,
    area: p?.area ?? null,
    bedrooms: p?.bedrooms ?? null,
    bathrooms: p?.bathrooms ?? null,
    floors: p?.floors ?? null,
    house_type: p?.house_type ?? null,
    land_type: p?.land_type ?? null,
    images: p?.images ?? null,
    phone: p?.phone ?? null,
    owner: p?.owner ?? null,
    amenities: p?.amenities ?? null,
  };
}

async function fetchAvailable(cfg) {
  const select = `id, property_id, status, location, ${cfg.saleCols.join(', ')}, created_at, properties:${cfg.fk}(*)`;

  const { data: saleRows, error: saleErr } = await supabase
    .from(cfg.key)
    .select(select)
    .eq('status', 'available')
    .is('deleted_at', null)
    .eq('properties.deleted_at', null)
    .in('properties.type', cfg.typeList);

  if (saleErr) throw saleErr;

  const { data: candidates, error: propErr } = await supabase
    .from('properties')
    .select('*')
    .in('type', cfg.typeList)
    .eq('status', 'available')
    .is('deleted_at', null);

  if (propErr) throw propErr;

  const linkedPropertyIds = new Set((saleRows || []).map((s) => s.property_id));
  const standalone = (candidates || []).filter((p) => !linkedPropertyIds.has(p.id));

  const rows = [
    ...(saleRows || []).map((s) => {
      const p = s.properties || {};
      const saleFields = {};
      for (const col of cfg.saleCols) saleFields[col] = s[col] ?? null;
      const row = {
        sale_id: s.id,
        property_id: s.property_id,
        status: s.status,
        sale_location: s.location ?? null,
        ...saleFields,
        ...propertyShape(p),
        created_at: s.created_at ?? p.created_at ?? null,
      };
      return { ...row, images_parsed: parseImages(row.images) };
    }),
    ...standalone.map((p) => {
      const row = {
        sale_id: null,
        property_id: p.id,
        status: p.status,
        sale_location: null,
        ...standaloneSaleCols(cfg, p.price ?? null),
        ...propertyShape(p),
        created_at: p.created_at ?? null,
      };
      return { ...row, images_parsed: parseImages(row.images) };
    }),
  ];

  rows.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));

  return rows;
}

export async function getPublicListings() {
  const [houseSales, houseRentals, landSales] = await Promise.all([
    fetchAvailable(MODULES.house_sale),
    fetchAvailable(MODULES.house_rental),
    fetchAvailable(MODULES.land_sale),
  ]);

  return {
    house_sales: houseSales,
    house_rentals: houseRentals,
    land_sales: landSales,
  };
}

export async function getPublicListing(id) {
  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('status', 'available')
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') throw new Error('Not found');
    throw error;
  }

  const table =
    property.type === 'house-rental'
      ? 'house_rentals'
      : property.type === 'land' || property.type === 'land-sale'
        ? 'land_sales'
        : 'house_sales';

  const { data: sale, error: saleErr } = await supabase
    .from(table)
    .select('*')
    .eq('property_id', property.id)
    .eq('status', 'available')
    .is('deleted_at', null)
    .maybeSingle();

  if (saleErr) throw saleErr;

  const { images, ...rest } = property;
  return {
    ...rest,
    images_parsed: parseImages(images),
    sale: sale || null,
  };
}

const nowIso = () => new Date().toISOString();

// Mirrors backend publicController.register/contact — writes directly to
// public_inquiries so the static (Vercel) public site has no backend dependency.
export async function submitPublicRegister({ name, phone, interest }) {
  const { data, error } = await supabase
    .from('public_inquiries')
    .insert({
      type: 'register',
      name: String(name || '').trim(),
      email: '',
      phone: phone || null,
      interest: interest || null,
      subject: null,
      message: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    })
    .select('id')
    .single();

  if (error) throw new Error('Khalad baa dhacay. Mar kale isku day.');
  return data.id;
}

export async function submitPublicContact({ name, email, phone, subject, message }) {
  const { data, error } = await supabase
    .from('public_inquiries')
    .insert({
      type: 'contact',
      name: String(name || '').trim(),
      email: String(email || '').trim(),
      phone: phone || null,
      interest: null,
      subject: subject || null,
      message: message || null,
      created_at: nowIso(),
      updated_at: nowIso(),
    })
    .select('id')
    .single();

  if (error) throw new Error('Khalad baa dhacay. Mar kale isku day.');
  return data.id;
}