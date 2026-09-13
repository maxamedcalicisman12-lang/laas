import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import { useApp } from '../context/AppContext';

const TYPE_EMOJI = {
  house: '🏠',
  'house-rental': '🔑',
  land: '🌍',
  apartment: '🏢',
  commercial: '🏬',
  villa: '🏡',
};

const DEFAULT_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23e5e7eb%22/><text x=%2250%25%22 y=%2250%25%22 font-size=%2260%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22>🏠</text></svg>';

function formatPrice(value) {
  const n = Number(value || 0);
  return n.toLocaleString('en-US');
}

function PhoneButton({ phone }) {
  if (!phone) return null;
  const clean = String(phone).replace(/[^0-9]/g, '');
  const wa = `https://wa.me/${clean.length > 10 && clean.startsWith('0') ? clean.replace(/^0/, '252') : clean}`;
  return (
    <a
      href={wa}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all"
    >
      WhatsApp
    </a>
  );
}

function Detail({ label, value }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{value || '—'}</p>
    </div>
  );
}

export default function PublicPropertyDetail() {
  const { id } = useParams();
  const { dark, toggleDark, t } = useApp();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/public/listings/${id}`)
      .then(({ data }) => setProperty(data))
      .catch((err) => setError(err.response?.data?.message || 'Property failed to load.'))
      .finally(() => setLoading(false));
  }, [id]);

  const isRental = property?.type === 'house-rental';

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased dark:bg-slate-950">
      <header className="site-header bg-gradient-to-r from-sky-900 via-sky-700 to-sky-500 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <button onClick={() => (window.location.href = '/listings')} className="text-left group">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
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
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white text-white hover:text-sky-900 text-sm font-semibold backdrop-blur transition-all"
            >
              🔐 {t('login')}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/listings" className="inline-flex items-center gap-2 text-sm text-sky-700 hover:text-sky-800 mb-6 dark:text-sky-400">
          ← Ku noqo list-ka qaadista
        </Link>

        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 dark:bg-slate-900 dark:border-slate-700/80">
            <div className="h-72 bg-gray-200 dark:bg-slate-800 rounded-t-2xl animate-pulse" />
            <div className="p-6 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-1/2 dark:bg-slate-800 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded w-1/3 dark:bg-slate-800 animate-pulse" />
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-8 text-center text-sm dark:bg-red-950/40 dark:border-red-900 dark:text-red-300">
            <div className="text-3xl mb-2">⚠️</div>
            {error}
          </div>
        )}

        {!loading && !error && property && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden dark:bg-slate-900 dark:border-slate-700/80">
            <div className="relative h-72 sm:h-96 overflow-hidden">
              {property.images_parsed?.[0] ? (
                <img
                  src={`/storage/${property.images_parsed[0]}`}
                  alt={property.title || 'Property'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl bg-gradient-to-br from-sky-50 to-slate-100">
                  {TYPE_EMOJI[property.type] || '🏠'}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  {t('available')}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{property.title || 'Property'}</h1>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5 dark:text-gray-400">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-sky-500" fill="currentColor" aria-hidden="true">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
                    </svg>
                    {property.location || '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl text-gray-500 text-sm font-semibold dark:text-gray-400">
                    {isRental ? t('for_rent') : t('for_sale')}
                  </p>
                  <p className="text-3xl font-bold text-sky-700 dark:text-sky-400">
                    <span className="text-lg text-sky-500">$</span>
                    {formatPrice(
                      isRental
                        ? property.sale?.rent_amount ?? property.price
                        : property.sale?.sale_price ?? property.price
                    )}
                    {isRental && <span className="text-base font-semibold text-gray-400">/month</span>}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Detail label={t('type')} value={<span className="capitalize">{String(property.type).replace(/-/g, ' ')}</span>} />
                {(isRental || property.type === 'house') && (
                  <>
                    <Detail label={t('bedrooms')} value={property.bedrooms} />
                    <Detail label={t('bathrooms')} value={property.bathrooms} />
                  </>
                )}
                {property.type === 'land' && property.sale && (
                  <>
                    <Detail label={t('meters')} value={property.sale.meters} />
                  </>
                )}
                {property.type === 'house' && property.sale && (
                  <>
                    <Detail label={t('sale_date')} value={property.sale.sale_date} />
                  </>
                )}
              </div>

              {property.description && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('description')}</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">{property.description}</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-2 dark:border-slate-800">
                {property.phone ? (
                  <>
                    <PhoneButton phone={property.phone} />
                  </>
                ) : (
                  <span className="flex-1 text-xs text-gray-400 text-center py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl dark:bg-slate-800 dark:border-slate-600 dark:text-gray-500">
                    {t('contact_office')}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
