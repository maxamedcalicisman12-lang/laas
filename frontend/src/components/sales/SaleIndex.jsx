import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import StatusPill from '../../components/StatusPill';
import Pagination from '../../components/Pagination';
import SortableTh from '../SortableTh';

export default function SaleIndex({ config }) {
  const { t, confirm, flashMessage } = useApp();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState(params.get('search') || '');
  const query = Object.fromEntries(params.entries());

  const load = () => {
    api.get(`/${config.endpoint}`, { params: query }).then(({ data }) => setData(data));
  };

  useEffect(load, [params]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === null || value === undefined) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  };

  const toggleStatus = async (row) => {
    try {
      await api.patch(`/${config.endpoint}/${row.id}/toggle-status`);
      load();
    } catch (err) {
      flashMessage('error', err.response?.data?.message || 'Failed to toggle status.');
    }
  };

  const destroy = (id) => {
    confirm(t(config.deleteMessage), async () => {
      try {
        await api.delete(`/${config.endpoint}/${id}`);
        flashMessage('success', `${config.label} deleted successfully.`);
        load();
      } catch (err) {
        flashMessage('error', err.response?.data?.message || `Failed to delete ${config.label.toLowerCase()}. Please try again.`);
      }
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t(config.title)}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t(config.subtitle)}</p>
        </div>
        <Link to={`/${config.endpoint}/create`} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg">
          + {t(config.addLabel)}
        </Link>
      </div>

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
          placeholder={t(config.searchPlaceholder)}
          className="w-2/5 min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none"
        />
        <select value={query.status || ''} onChange={(e) => setParam('status', e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none">
          <option value="">{t('all_statuses')}</option>
          <option value="available">{t('available')}</option>
          <option value="not_available">{t('not_available')}</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg">{t('search')}</button>
        {(query.search || query.status) && (
          <button type="button" onClick={() => { setSearch(''); setParams(new URLSearchParams()); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            {t('clear')}
          </button>
        )}
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              <tr>
                <SortableTh label={t('property')} field="property_title" />
                <SortableTh label={t('customer')} field="customer_name" />
                <SortableTh label={t(config.amountLabel)} field="amount" />
                {config.hasMeters && <SortableTh label={t('land_size_m')} field="meters" />}
                {config.hasCommission && <SortableTh label={t('commission')} field="commission" />}
                <SortableTh label={t('location')} field="location" />
                <SortableTh label={t('status')} field="status" />
                <th className="text-left px-4 py-3 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data?.data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.property_title || `#${row.property_id}`}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.customer_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    ${Number(row[config.amountField] || 0).toLocaleString()}
                    {config.perMonth && <span className="text-xs text-gray-500">/mo</span>}
                  </td>
                  {config.hasMeters && <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.meters || '—'}</td>}
                  {config.hasCommission && <td className="px-4 py-3 text-gray-600 dark:text-gray-300">${Number(row.commission || 0).toLocaleString()}</td>}
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.location || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(row)} className="focus:outline-none" title={t('click_to_toggle_status')}>
                      <StatusPill status={row.status} labels={{ available: t('available'), not_available: t('not_available') }} />
                    </button>
                  </td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    <Link to={`/${config.endpoint}/${row.id}`} className="text-blue-600 hover:text-blue-800">{t('view')}</Link>
                    <Link to={`/${config.endpoint}/${row.id}/edit`} className="text-yellow-600 hover:text-yellow-700">{t('edit')}</Link>
                    <button onClick={() => destroy(row.id)} className="text-red-600 hover:text-red-700">{t('delete')}</button>
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-500">{t(config.emptyMessage)}</td>
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
