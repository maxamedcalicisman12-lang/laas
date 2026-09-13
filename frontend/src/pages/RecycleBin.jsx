import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import Pagination from '../components/Pagination';
import SortableTh from '../components/SortableTh';

const TYPE_ROUTES = {
  property: 'properties',
  customer: 'customers',
  land_sale: 'land-sales',
  house_rental: 'house-rentals',
  house_sale: 'house-sales',
  used_item: 'used-items',
  payment: 'payments',
  cleaner: 'cleaners',
  user: 'users',
};

export default function RecycleBin() {
  const { t, flashMessage } = useApp();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);
  const query = Object.fromEntries(params.entries());

  const load = () => {
    api.get('/recycle-bin', { params: query }).then(({ data }) => setData(data));
  };

  useEffect(load, [params]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === null || value === undefined) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  };

  const run = async (label, fn) => {
    setBusy(label);
    try {
      await fn();
    } catch (err) {
      flashMessage('error', err.response?.data?.message || t('operation_failed'));
    } finally {
      setBusy(null);
    }
  };

  const restore = async (item) => {
    await run(`restore-${item.id}`, async () => {
      await api.post(`/recycle-bin/${item.type}/${item.id}/restore`);
      flashMessage('success', t('item_restored'));
      load();
    });
  };

  const forceDelete = async (item) => {
    if (!window.confirm(`${t('permanent_delete_confirm_name')} "${item.name}"? ${t('cannot_be_undone')}.`)) return;
    await run(`delete-${item.id}`, async () => {
      await api.delete(`/recycle-bin/${item.type}/${item.id}/force-delete`);
      flashMessage('success', t('item_permanently_deleted'));
      load();
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('recycle_bin')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('restore_remove_desc')}</p>
        </div>
        <div className="flex space-x-2">
          {['', 'property', 'customer', 'land_sale', 'house_rental', 'house_sale', 'used_item', 'payment', 'cleaner'].map((type) => (
            <button
              key={type || 'all'}
              onClick={() => setParam('type', type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize ${
                (query.type || '') === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'
              }`}
            >
              {type ? String(type).replace(/_/g, ' ') : t('all')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              <tr>
                <SortableTh label={t('type')} field="type" />
                <SortableTh label={t('name')} field="name" />
                <SortableTh label={t('deleted_at')} field="deleted_at" />
                <th className="text-left px-4 py-3 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {(data?.data || []).map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 capitalize">
                      {String(item.type).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.deleted_at}</td>
                  <td className="px-4 py-3 whitespace-nowrap space-x-3">
                    <button
                      onClick={() => restore(item)}
                      disabled={busy}
                      className="text-green-600 hover:text-green-700 disabled:opacity-50"
                    >
                      {busy === `restore-${item.id}` ? t('restoring') : t('restore')}
                    </button>
                    <button
                      onClick={() => forceDelete(item)}
                      disabled={busy}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {busy === `delete-${item.id}` ? t('deleting') : t('delete')}
                    </button>
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">{t('recycle_bin_empty')}</td>
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
