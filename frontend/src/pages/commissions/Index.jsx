import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';
import SortableTh from '../../components/SortableTh';

const TYPE_LABELS = {
  land_sale: 'land_sale',
  house_sale: 'house_sale',
  house_rental: 'house_rental',
};

const TYPE_COLORS = {
  land_sale: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  house_sale: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  house_rental: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const SOURCE_PATH = {
  land_sale: '/land-sales/',
  house_sale: '/house-sales/',
  house_rental: '/house-rentals/',
};

export default function CommissionsIndex() {
  const { t, confirm, flashMessage } = useApp();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState(params.get('search') || '');
  const [rate, setRate] = useState('10');
  const query = Object.fromEntries(params.entries());

  const load = () => {
    api.get('/commissions', { params: query }).then(({ data }) => setData(data));
  };

  useEffect(load, [params]);

  useEffect(() => {
    api.get('/settings').then(({ data }) => setRate(data.settings.commission_rate || '10')).catch(() => {});
  }, []);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === null || value === undefined) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  };

  const saveRate = async () => {
    try {
      await api.post('/settings/commission', { commission_rate: rate });
      flashMessage('success', 'Commission rate updated successfully.');
    } catch (err) {
      flashMessage('error', err.response?.data?.message || 'Failed to update commission rate.');
    }
  };

  const destroy = (id) => {
    confirm('Delete this commission record?', async () => {
      try {
        await api.delete(`/commissions/${id}`);
        flashMessage('success', 'Commission deleted successfully.');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('commissions')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('auto_commissions_desc')}</p>
        </div>
        {user?.role === 'super_admin' && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none"
            />
            <button onClick={saveRate} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg">
              {t('commission_rate')}
            </button>
          </div>
        )}
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
          placeholder={t('search_commissions')}
          className="w-2/5 min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none"
        />
        <select value={query.type || ''} onChange={(e) => setParam('type', e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
          <option value="">{t('all_types')}</option>
          <option value="land_sale">{t('land_sale')}</option>
          <option value="house_sale">{t('house_sale')}</option>
          <option value="house_rental">{t('house_rental')}</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg">{t('search')}</button>
        {(query.search || query.type) && (
          <button type="button" onClick={() => { setSearch(''); setParams(new URLSearchParams()); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            {t('clear')}
          </button>
        )}
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400 block">{t('commissions')}</span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">${Number(data?.summary?.total_commission || 0).toLocaleString()}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400 block">{t('total_amount')}</span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">${Number(data?.summary?.total_amount || 0).toLocaleString()}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400 block">{t('total_records')}</span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">{data?.summary?.count || 0}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              <tr>
                <SortableTh label={t('type')} field="commission_type" />
                <SortableTh label={t('customer')} field="customer_name" />
                <SortableTh label={t('property')} field="property_title" />
                <SortableTh label={t('amount')} field="amount" />
                <SortableTh label={t('rate')} field="rate" />
                <SortableTh label={t('commission')} field="commission" />
                <SortableTh label={t('date')} field="created_at" />
                <th className="text-left px-4 py-3 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data?.data.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${TYPE_COLORS[c.commission_type] || ''}`}>
                      {t(TYPE_LABELS[c.commission_type] || c.commission_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{c.customer_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.property_title || `#${c.property_id}`}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">${Number(c.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.rate}%</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">${Number(c.commission).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    <Link to={`/commissions/${c.id}`} className="text-blue-600 hover:text-blue-800">{t('view')}</Link>
                    {SOURCE_PATH[c.commission_type] && (
                      <Link to={`${SOURCE_PATH[c.commission_type]}${c.commission_id}`} className="text-yellow-600 hover:text-yellow-700">{t('source')}</Link>
                    )}
                    <button onClick={() => destroy(c.id)} className="text-red-600 hover:text-red-700">{t('delete')}</button>
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-500">{t('no_commissions_found')}</td>
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