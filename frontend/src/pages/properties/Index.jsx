import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import StatusPill from '../../components/StatusPill';
import Pagination from '../../components/Pagination';

const TYPE_COLORS = {
  land: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  house: 'bg-blue-600 text-white',
  apartment: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  commercial: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  villa: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
};

export default function PropertiesIndex() {
  const { t, confirm, flashMessage } = useApp();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [search, setSearch] = useState(params.get('search') || '');

  const query = Object.fromEntries(params.entries());

  const load = () => {
    api.get('/properties', { params: query }).then(({ data }) => {
      setData(data);
      setNeighborhoods(data.neighborhoods || []);
    });
  };

  useEffect(load, [params]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === null || value === undefined) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  };

  const toggleSort = (field) => {
    const currentSort = params.get('sort');
    const currentDir = params.get('direction');
    if (currentSort === field) {
      setParam('direction', currentDir === 'asc' ? 'desc' : 'asc');
    } else {
      const next = new URLSearchParams(params);
      next.set('sort', field);
      next.set('direction', 'asc');
      setParams(next);
    }
  };

  const sortIcon = (field) => {
    if (params.get('sort') !== field) return null;
    return params.get('direction') === 'asc' ? ' ▲' : ' ▼';
  };

  const destroy = (id, title) => {
    confirm(t('delete_property'), async () => {
      try {
        await api.delete(`/properties/${id}`);
        flashMessage('success', 'Property deleted successfully.');
        load();
      } catch (err) {
        flashMessage('error', err.response?.data?.message || 'Failed to delete.');
      }
    });
  };

  const hasFilters = ['status', 'type', 'location', 'search'].some((k) => params.get(k));
  const statusPills = [
    { value: '', label: t('all') },
    { value: 'available', label: t('available') },
    { value: 'rented', label: t('rented') },
    { value: 'sold', label: t('sold') },
    { value: 'pending', label: t('pending') },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('all_properties')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('manage_properties')}</p>
        </div>
        <Link
          to="/properties/create"
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg"
        >
          + {t('add_property')}
        </Link>
      </div>

      {/* Filter bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setParam('search', search);
        }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 flex flex-wrap items-center gap-3"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search_by')}
          className="w-2/5 min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none"
        />
        <select value={query.type || ''} onChange={(e) => setParam('type', e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none">
          <option value="">{t('all_property_types')}</option>
          {['land', 'house', 'house-rental'].map((tp) => (
            <option key={tp} value={tp}>{String(tp).replace(/-/g, ' ').charAt(0).toUpperCase() + String(tp).replace(/-/g, ' ').slice(1)}</option>
          ))}
        </select>
        <select value={query.location || ''} onChange={(e) => setParam('location', e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none">
          <option value="">{t('all_locations')}</option>
          {neighborhoods.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg">{t('search')}</button>
        {hasFilters && (
          <button type="button" onClick={() => { setSearch(''); setParams(new URLSearchParams()); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            {t('clear')}
          </button>
        )}
      </form>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statusPills.map((s) => (
          <button
            key={s.value}
            onClick={() => setParam('status', s.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full ${
              (query.status || '') === s.value
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('image')}</th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('title')}>{t('title')}{sortIcon('title')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('owner')}</th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('type')}>{t('type')}{sortIcon('type')}</th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('location')}>{t('location')}{sortIcon('location')}</th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('price')}>{t('price')}{sortIcon('price')}</th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('status')}>{t('status')}{sortIcon('status')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data?.data.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    {p.images_parsed?.[0] ? (
                      <img src={`/storage/${p.images_parsed[0]}`} alt={p.title} className="w-12 h-12 object-cover rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.title}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.owner || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${TYPE_COLORS[p.type] || 'bg-gray-100 text-gray-800'}`}>{p.type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.location || '—'}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">${Number(p.price || 0).toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusPill status={p.status} labels={{ available: t('available'), not_available: t('not_available'), rented: t('rented'), sold: t('sold'), pending: t('pending') }} /></td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    <Link to={`/properties/${p.id}`} className="text-blue-600 hover:text-blue-800 text-sm">{t('view')}</Link>
                    <Link to={`/properties/${p.id}/edit`} className="text-yellow-600 hover:text-yellow-700 text-sm">{t('edit')}</Link>
                    <button onClick={() => destroy(p.id, p.title)} className="text-red-600 hover:text-red-700 text-sm">{t('delete')}</button>
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-500">{t('no_properties_found')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination meta={data} onPage={(p) => setParam('page', p)} />
      </div>
    </div>
  );
}
