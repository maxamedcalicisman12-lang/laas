import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicListings, submitPublicRegister } from '../api/supabase';
import { useApp } from '../context/AppContext';

const TABS = [
  { key: 'house_sales', label: 'Guryaha Iibka ah', emoji: '🏠' },
  { key: 'house_rentals', label: 'Guryaha Kirada ah', emoji: '🔑' },
  { key: 'land_sales', label: 'Dhulka Iibka ah', emoji: '🌍' },
];

const TYPE_EMOJI = {
  house: '🏠',
  apartment: '🏢',
  land: '🌍',
  commercial: '🏬',
  villa: '🏡',
};

const DEFAULT_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23e5e7eb%22/><text x=%2250%25%22 y=%2250%25%22 font-size=%2260%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22>🏠</text></svg>';

function formatPrice(value) {
  const n = Number(value || 0);
  return n.toLocaleString('en-US');
}

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white placeholder-gray-400 shadow-sm transition focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-gray-500';

function PhoneButton({ phone }) {
  if (!phone) return null;
  const clean = String(phone).replace(/[^0-9]/g, '');
  const wa = `https://wa.me/${clean.length > 10 && clean.startsWith('0') ? clean.replace(/^0/, '252') : clean}`;
  return (
    <a
      href={wa}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex flex-1 items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
      WhatsApp
    </a>
  );
}

function FeatureChip({ children }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300">
      {children}
    </span>
  );
}

function PropertySkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-sm animate-pulse dark:bg-slate-900 dark:border-slate-700/80">
      <div className="h-52 bg-gray-200 dark:bg-slate-800" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4 dark:bg-slate-800" />
        <div className="h-3 bg-gray-200 rounded w-1/2 dark:bg-slate-800" />
        <div className="h-6 bg-gray-200 rounded w-1/3 dark:bg-slate-800" />
        <div className="h-3 bg-gray-200 rounded w-full dark:bg-slate-800" />
        <div className="h-10 bg-gray-200 rounded-xl mt-2 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export default function PublicListings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('house_sales');
  const [search, setSearch] = useState('');
  const [regForm, setRegForm] = useState({ name: '', phone: '', interest: 'house_sale' });
  const [regMsg, setRegMsg] = useState(null);
  const [regError, setRegError] = useState(null);
  const [regLoading, setRegLoading] = useState(false);
  const { dark, toggleDark } = useApp();

  const submitRegister = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setRegMsg(null);
    setRegError(null);
    try {
      await submitPublicRegister(regForm);
      setRegMsg('Diwaangelin waad ku guuleysatay. Waannu kula xiriiri doonnaa.');
      setRegForm({ name: '', phone: '', interest: 'house_sale' });
    } catch (err) {
      setRegError(err.message || 'Khalad baa dhacay.');
    } finally {
      setRegLoading(false);
    }
  };

  useEffect(() => {
    getPublicListings()
      .then((data) => setData(data))
      .catch((err) => setError(err.message || 'Listings failed to load.'))
      .finally(() => setLoading(false));
  }, []);

  const category = useMemo(() => data?.[activeTab] || [], [data, activeTab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return category;
    return category.filter((item) => {
      const haystack = [
        item.title,
        item.owner,
        item.property_location,
        item.sale_location,
        item.address,
        item.area,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [category, search]);

  const countByTab = useMemo(() => {
    const counts = {};
    for (const tab of TABS) counts[tab.key] = (data?.[tab.key] || []).length;
    return counts;
  }, [data]);

  const totalCount = useMemo(
    () =>
      TABS.reduce((sum, tab) => sum + (data?.[tab.key] || []).length, 0),
    [data]
  );

  const isRental = activeTab === 'house_rentals';

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased dark:bg-slate-950">
      {/* Header */}
      <header className="site-header bg-gradient-to-r from-sky-900 via-sky-700 to-sky-500 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          <button onClick={() => setActiveTab('house_sales')} className="text-left group">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              LAAS <span className="text-yellow-400">Real Estate</span>
            </h1>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDark}
              title={dark ? 'Ku noqo light mode' : 'U beddel dark mode'}
              aria-label="Toggle dark mode"
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white text-white hover:text-sky-900 backdrop-blur transition-all"
            >
              {dark ? (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white text-white hover:text-sky-900 text-sm font-semibold backdrop-blur transition-all"
            >
              🔐 Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-sky-700 to-sky-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-300 mb-2">
                Available Listings
              </p>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
                Raadi gurtiin ama dhul — <span className="text-yellow-400">sii habboon</span>
              </h2>
              <p className="mt-2 text-sky-100/80 text-sm sm:text-base max-w-xl">
                <strong>Soo dhowow Macmiil!</strong> Halkan waxaa kugu diyaar ah dhulal iib ah, guryo iib ah iyo guryo kiro ah. Waxaan mar walba diyaar kugu nahay lambada xagga hoose kaaga muuqda. Mahadsanid inaad na dooratay macmiil.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {totalCount} Catalog
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 relative">
        {/* Toolbar: tabs + search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-3 sm:p-4 mb-8 dark:bg-slate-900 dark:border-slate-700/80">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md ring-2 ring-sky-300'
                      : 'bg-gray-50 text-gray-600 hover:bg-sky-50 hover:text-sky-700 border border-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-sky-300 dark:border-slate-600'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  {tab.label}
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      activeTab === tab.key ? 'bg-white/25 text-white' : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {countByTab[tab.key] || 0}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative flex-1 lg:max-w-sm ml-auto w-full">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="U baadh magac ama location..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-gray-500 dark:focus:bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <PropertySkeleton />
            <PropertySkeleton />
            <PropertySkeleton />
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-8 text-center text-sm dark:bg-red-950/40 dark:border-red-900 dark:text-red-300">
            <div className="text-3xl mb-2">⚠️</div>
            {error}
          </div>
        )}

        {/* Cards */}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div className="bg-white border border-gray-200/80 rounded-2xl p-14 text-center shadow-sm dark:bg-slate-900 dark:border-slate-700/80">
                <div className="text-5xl mb-3">🔎</div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Wax jiro ah lama helin</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto dark:text-gray-400">
                  {search
                    ? 'Hubi inaad si sax ah u qortay ama iskuday ereyo kale.'
                    : 'Ma jiraan wax aad ku arki karto hadda. Dib u booqo dhawaan.'}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors"
                  >
                    ✕ Nadiifi search-ka
                  </button>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((item) => {
                  const image = item.images_parsed?.[0];
                  const price =
                    (activeTab === 'house_rentals' ? item.rent_amount : item.sale_price) ??
                    item.property_price;
                  return (
                    <article
                      key={`${activeTab}-${item.sale_id ?? item.property_id}`}
                      className="group bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-sky-200 transition-all duration-300 flex flex-col dark:bg-slate-900 dark:border-slate-700/80 dark:hover:border-slate-600"
                    >
                      <div className="relative h-52 overflow-hidden">
                        <Link to={`/listings/${item.property_id}`} className="block w-full h-full">
                          {image ? (
                            <img
                              src={`/storage/${image}`}
                              alt={item.title || 'Property'}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-sky-50 to-slate-100">
                              {TYPE_EMOJI[item.property_type] || '🏠'}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            Available
                          </span>
                          {item.property_type && (
                            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-white/90 backdrop-blur text-sky-800 shadow-md">
                              {item.property_type}
                            </span>
                          )}
                        </Link>
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <Link to={`/listings/${item.property_id}`}>
                          <h3 className="font-semibold text-gray-900 text-[15px] leading-snug line-clamp-1 group-hover:text-sky-700 transition-colors dark:text-gray-100 dark:group-hover:text-sky-400">
                            {item.title || `Property #${item.property_id}`}
                          </h3>
                        </Link>

                        {(activeTab === 'house_sales' || activeTab === 'house_rentals') && item.house_type && (
                          <span className="mt-2">
                            <FeatureChip>🏠 {item.house_type}</FeatureChip>
                          </span>
                        )}

                        {item.sale_location || item.property_location ? (
                          <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5 truncate dark:text-gray-400">
                            <svg
                              viewBox="0 0 24 24"
                              className="w-3.5 h-3.5 shrink-0 text-sky-500"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
                            </svg>
                            {item.sale_location || item.property_location}
                          </p>
                        ) : null}

                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span className="text-2xl font-bold text-sky-700 dark:text-sky-400">
                            <span className="text-sm font-semibold text-sky-500 mr-0.5">$</span>
                            {formatPrice(price)}
                          </span>
                          {isRental && <span className="text-xs text-gray-500 dark:text-gray-400">/month</span>}
                        </div>

                        {(activeTab === 'house_sales' || activeTab === 'house_rentals') && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.bedrooms && <FeatureChip>🛏️ {item.bedrooms}</FeatureChip>}
                            {item.bathrooms && <FeatureChip>🛁 {item.bathrooms}</FeatureChip>}
                          </div>
                        )}

                        {activeTab === 'land_sales' && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.meters && <FeatureChip>📏 {item.meters}</FeatureChip>}
                          </div>
                        )}

                        {activeTab === 'land_sales' && item.description && (
                          <p className="mt-3 text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1 dark:text-gray-400">
                            {item.description}
                          </p>
                        )}

                        <div className="mt-auto pt-4 flex items-center gap-2">
                          {item.phone ? (
                            <>
                              <PhoneButton phone={item.phone} />
                              <a
                                href={`tel:${item.phone}`}
                                title="Wac"
                                className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300 transition-all dark:border-slate-600 dark:text-sky-400 dark:hover:bg-slate-800 dark:hover:border-slate-500"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                              </a>
                            </>
                          ) : (
                            <span className="flex-1 text-xs text-gray-400 text-center py-2.5 bg-gray-50 border border-dashed border-gray-200 rounded-xl dark:bg-slate-800 dark:border-slate-600 dark:text-gray-500">
                              Contact office for details
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Register */}
        <section className="mt-14">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden max-w-2xl mx-auto dark:bg-slate-900 dark:border-slate-700/80">
            <div className="px-6 py-5 bg-gradient-to-r from-sky-50 to-sky-100/60 border-b border-sky-100 flex items-center gap-3 dark:from-slate-800 dark:to-slate-800 dark:border-slate-700">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white flex items-center justify-center text-xl shadow-sm">
                📝
              </span>
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-tight dark:text-white">Diwaangalin</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Si aad ugala xiriirito guryaha &amp; dhulka, hoos isku diiwaangeli.
                </p>
              </div>
            </div>
            <form onSubmit={submitRegister} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">Magaca *</label>
                  <input
                    type="text"
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">Telefon *</label>
                  <input
                    type="tel"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">Waxa aad rabto</label>
                <select
                  value={regForm.interest}
                  onChange={(e) => setRegForm({ ...regForm, interest: e.target.value })}
                  className={inputCls}
                >
                  <option value="house_sale">Guri Iib</option>
                  <option value="house_rental">Guri Kiro</option>
                  <option value="land_sale">Dhul Iib</option>
                  <option value="other">Wixii kale</option>
                </select>
              </div>
              {regMsg && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3 dark:text-green-300 dark:bg-green-950/40 dark:border-green-900">✓ {regMsg}</p>
              )}
              {regError && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 dark:text-red-300 dark:bg-red-950/40 dark:border-red-900">{regError}</p>
              )}
              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white text-sm font-semibold shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {regLoading ? 'Diwaangelin socota...' : 'Diwaangal hadda'}
              </button>
            </form>
          </div>
        </section>

        {/* Contact info */}
        <section className="mt-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 sm:p-8 dark:bg-slate-900 dark:border-slate-700/80">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white flex items-center justify-center text-xl shadow-sm">
                📍
              </span>
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-tight dark:text-white">Xariir nala sii</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Haddii aad su'aal qabtid, waxaanu u diyaar nahay.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a
                href="tel:+252634913220"
                className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-sky-100 p-4 hover:border-sky-200 hover:shadow-sm transition-all dark:from-slate-800 dark:to-slate-900 dark:border-slate-700 dark:hover:border-slate-600"
              >
                <span className="w-11 h-11 rounded-xl bg-sky-600 text-white flex items-center justify-center text-xl shrink-0">📞</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Telefon</p>
                  <p className="font-semibold text-gray-900 text-sm truncate dark:text-gray-100">+252 63 491 3220</p>
                </div>
              </a>
              <a
                href="https://wa.me/252634913220"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-4 hover:border-emerald-200 hover:shadow-sm transition-all dark:from-slate-800 dark:to-slate-900 dark:border-slate-700 dark:hover:border-slate-600"
              >
                <span className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0">💬</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">WhatsApp</p>
                  <p className="font-semibold text-gray-900 text-sm truncate dark:text-gray-100">+252 63 491 3220</p>
                </div>
              </a>
              <a
                href="mailto:anwaryare061@gmail.com"
                className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-sky-100 p-4 hover:border-sky-200 hover:shadow-sm transition-all dark:from-slate-800 dark:to-slate-900 dark:border-slate-700 dark:hover:border-slate-600"
              >
                <span className="w-11 h-11 rounded-xl bg-sky-600 text-white flex items-center justify-center text-xl shrink-0">✉️</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900 text-sm truncate dark:text-gray-100">anwaryare061@gmail.com</p>
                </div>
              </a>
              <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-sky-100 p-4 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700">
                <span className="w-11 h-11 rounded-xl bg-sky-600 text-white flex items-center justify-center text-xl shrink-0">🏢</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Xafiiska</p>
                  <p className="font-semibold text-gray-900 text-sm leading-snug break-words dark:text-gray-100">WB Laascaanood, Dahabshil wayn dabadeeda</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-14 py-8 text-center text-sm text-gray-500 bg-white border-t border-gray-100 dark:bg-slate-900 dark:border-slate-800 dark:text-gray-400">
        <p>© {new Date().getFullYear()} <span className="font-semibold text-sky-700 dark:text-sky-400">LAAS Real Estate</span> — Dhamaan guryaha iyo dhulka waa la heli karaa.</p>
      </footer>
    </div>
  );
}