import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const ICONS = {
  building: (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
  ),
  users: (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
  ),
  money: (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  coin: (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  chart: (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  ),
  cube: (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
  ),
  sparkle: (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
  ),
  trash: (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
  ),
};

function StatCard({ gradient, icon, label, value, to, children }) {
  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} pointer-events-none`} />
      {to ? (
        <Link to={to} className="flex items-center justify-between group">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          </div>
          <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
            {icon}
          </div>
        </Link>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          </div>
          <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-sm`}>
            {icon}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

function MiniChip({ to, dot, className = '', children }) {
  const inner = (
    <>
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {children}
    </>
  );
  const cls = `flex items-center gap-1.5 hover:underline ${className}`;
  return to ? (
    <Link to={to} className={cls}>{inner}</Link>
  ) : (
    <span className={cls}>{inner}</span>
  );
}

const ucFirst = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(String(dateStr).replace(' ', 'T')).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs} second${secs === 1 ? '' : 's'} ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

const TYPE_BADGE = {
  land: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  house: 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white',
  apartment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  commercial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  villa: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const PROP_STATUS_BADGE = {
  available: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  rented: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  sold: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
};
const PAY_STATUS_BADGE = {
  completed: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  pending: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  failed: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
};
const FALLBACK_BADGE = 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setError(false);
    api
      .get('/dashboard')
      .then(({ data }) => active && setData(data))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  if (!data) {
    return error ? (
      <div className="py-16 flex flex-col items-center justify-center text-center">
        <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard_load_failed')}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('backend_check')}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">{t('retry')}</button>
      </div>
    ) : (
      <div className="text-sm text-gray-500">{t('loading_dashboard')}</div>
    );
  }

  const { stats, recentProperties, recentPayments, recentActivities } = data;
  const money0 = (n) => `$${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const money2 = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('welcome_back')}, {user?.name}!</p>
          </div>
        </div>
      </div>

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard gradient="from-indigo-400 to-indigo-600" icon={ICONS.building} label={t('properties')} value={stats.total_properties} to="/properties">
          <div className="mt-4 flex items-center gap-4 text-xs">
            <MiniChip to="/properties?status=available" dot="bg-emerald-500" className="text-emerald-600 dark:text-emerald-400">{t('avail')}: {stats.available_properties}</MiniChip>
            <MiniChip to="/properties?status=rented" dot="bg-blue-500" className="text-blue-600 dark:text-blue-400">{t('rental')}: {stats.rented_properties}</MiniChip>
            <MiniChip to="/properties?status=sold" dot="bg-rose-500" className="text-rose-600 dark:text-rose-400">{t('sold')}: {stats.sold_properties}</MiniChip>
          </div>
        </StatCard>

        <StatCard gradient="from-teal-400 to-teal-600" icon={ICONS.users} label={t('customers')} value={stats.total_customers} to="/customers">
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <MiniChip to="/customers?tenant=1" dot="bg-teal-500" className="text-teal-600 dark:text-teal-400">{t('active_rentals')}: {stats.active_rentals}</MiniChip>
          </div>
        </StatCard>

        <StatCard gradient="from-amber-400 to-amber-600" icon={ICONS.money} label={t('revenue')} value={money0(stats.total_payments)} to="/payments">
          <div className="mt-4 flex items-center gap-4 text-xs">
            <MiniChip to="/payments?status=pending" dot="bg-amber-500" className="text-amber-600 dark:text-amber-400">
              {t('pending')}: <span className="font-semibold text-rose-600 dark:text-rose-400">{money0(stats.pending_payments)}</span>
            </MiniChip>
          </div>
        </StatCard>

        <StatCard gradient="from-rose-400 to-rose-600" icon={ICONS.chart} label={t('sales')} value={stats.land_sales + stats.house_sales}>
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <MiniChip to="/land-sales" dot="bg-rose-400">{t('land')}: {stats.land_sales}</MiniChip>
            <MiniChip to="/house-sales" dot="bg-rose-300">{t('house')}: {stats.house_sales}</MiniChip>
          </div>
        </StatCard>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Link to="/used-items" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3.5 flex items-center gap-3 hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
            {ICONS.cube}
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('used_items')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.used_items}</p>
          </div>
        </Link>
        <Link to="/commissions" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3.5 flex items-center gap-3 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800 transition-all duration-200">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-violet-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
            {ICONS.coin}
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('commissions')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{money0(stats.total_commission)}</p>
          </div>
        </Link>
        <Link to="/cleaners" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3.5 flex items-center gap-3 hover:shadow-md hover:border-cyan-200 dark:hover:border-cyan-800 transition-all duration-200">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
            {ICONS.sparkle}
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('cleaners')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.cleaners}</p>
          </div>
        </Link>
        <Link to="/recycle-bin" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3.5 flex items-center gap-3 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
            {ICONS.trash}
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('recycle_bin')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.recycle_bin_count}</p>
          </div>
        </Link>
      </div>

      {/* Recent Properties & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-300 to-indigo-500" />
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('recent_properties')}</h3>
            <Link to="/properties" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">{t('view_all')}</Link>
          </div>
          <div className="p-5">
            {recentProperties.length > 0 ? (
              <div className="space-y-1">
                {recentProperties.map((property) => (
                  <div key={property.id} className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{property.title}</p>
                      <p className="text-xs mt-0.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[property.type] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {ucFirst(property.type)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">&middot; {property.location}</span>
                      </p>
                    </div>
                    <span className={`shrink-0 ml-3 text-xs font-medium px-2.5 py-1 rounded-full ${PROP_STATUS_BADGE[property.status] || FALLBACK_BADGE}`}>
                      {ucFirst(property.status)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('no_properties_yet')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-300 to-teal-500" />
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('recent_payments')}</h3>
            <Link to="/payments" className="text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400">{t('view_all')}</Link>
          </div>
          <div className="p-5">
            {recentPayments.length > 0 ? (
              <div className="space-y-1">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{money2(payment.amount)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {payment.customer_name || 'N/A'} &middot; {ucFirst(payment.payment_method)}
                      </p>
                    </div>
                    <span className={`shrink-0 ml-3 text-xs font-medium px-2.5 py-1 rounded-full ${PAY_STATUS_BADGE[payment.status] || FALLBACK_BADGE}`}>
                      {ucFirst(payment.status)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('no_payments_yet')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="relative mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 to-amber-500" />
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('recent_activity')}</h3>
          <Link to="/activity-logs" className="text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400">{t('view_all')}</Link>
        </div>
        <div className="p-5">
          {recentActivities.length > 0 ? (
            <div className="space-y-1">
              {recentActivities.map((log) => (
                <div key={log.id} className="flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-lg hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-700 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-200">{(log.user_name || '?').charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{log.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(log.created_at)}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                    {String(log.module || '').replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('no_activity_yet')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
