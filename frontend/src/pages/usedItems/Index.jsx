import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import Pagination from '../../components/Pagination';
import SortableTh from '../../components/SortableTh';

const CONDITION_COLORS = {
  new: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  good: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  fair: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  poor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function UsedItemsIndex() {
  const { t, confirm, flashMessage } = useApp();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState(params.get('search') || '');
  const query = Object.fromEntries(params.entries());

  const load = () => {
    api.get('/used-items', { params: query }).then(({ data }) => setData(data));
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
      await api.patch(`/used-items/${row.id}/toggle-status`);
      load();
    } catch (err) {
      flashMessage('error', err.response?.data?.message || 'Failed to toggle status.');
    }
  };

  const destroy = (id, name) => {
    confirm(`Delete used item ${name}?`, async () => {
      try {
        await api.delete(`/used-items/${id}`);
        flashMessage('success', 'Used item deleted successfully.');
        load();
      } catch (err) {
        flashMessage('error', err.response?.data?.message || 'Failed to delete.');
      }
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('all_used_items')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('manage_used_items')}</p>
        </div>
        <Link to="/used-items/create" className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg">
          + {t('add_used_item')}
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
          placeholder={t('search_used_items')}
          className="w-2/5 min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none"
        />
        <select value={query.status || ''} onChange={(e) => setParam('status', e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
          <option value="">{t('all_statuses')}</option>
          <option value="available">{t('available')}</option>
          <option value="sold">{t('sold')}</option>
        </select>
        <select value={query.category || ''} onChange={(e) => setParam('category', e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
          <option value="">{t('all_categories')}</option>
          {(data?.categories || []).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg">{t('search')}</button>
        {(query.search || query.status || query.category) && (
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
                <SortableTh label={t('name')} field="name" />
                <SortableTh label={t('category')} field="category" />
                <SortableTh label={t('condition')} field="condition" />
                <SortableTh label={t('price')} field="price" />
                <SortableTh label={t('owner')} field="customer_name" />
                <SortableTh label={t('status')} field="status" />
                <th className="text-left px-4 py-3 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data?.data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.category || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${CONDITION_COLORS[item.condition] || 'bg-gray-100 text-gray-800'}`}>
                      {item.condition}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">${Number(item.price).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.customer_name || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(item)} className="focus:outline-none" title={t('click_to_toggle_status')}>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'sold'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}
                      >
                        {item.status === 'sold' ? t('sold') : t('available')}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    <Link to={`/used-items/${item.id}`} className="text-blue-600 hover:text-blue-800">{t('view')}</Link>
                    <button onClick={() => destroy(item.id, item.name)} className="text-red-600 hover:text-red-700">{t('delete')}</button>
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">{t('no_used_items_found')}</td>
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
