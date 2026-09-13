import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import Pagination from '../../components/Pagination';
import SortableTh from '../../components/SortableTh';

export default function CustomersIndex() {
  const { t, confirm, flashMessage } = useApp();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState(params.get('search') || '');
  const query = Object.fromEntries(params.entries());

  const load = () => {
    api.get('/customers', { params: query }).then(({ data }) => setData(data));
  };

  useEffect(load, [params]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === null || value === undefined) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  };

  const destroy = (id, name) => {
    confirm(`Delete customer ${name}?`, async () => {
      try {
        await api.delete(`/customers/${id}`);
        flashMessage('success', 'Customer deleted successfully.');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('all_customers')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('manage_customers')}</p>
        </div>
        <Link to="/customers/create" className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg">
          + {t('add_customer')}
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
          placeholder={t('search_customers')}
          className="w-2/5 min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none"
        />
        <button type="submit" className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg">{t('search')}</button>
        {(query.search || query.tenant) && (
          <button type="button" onClick={() => { setSearch(''); setParams(new URLSearchParams()); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            {t('clear')}
          </button>
        )}
      </form>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setParam('tenant', '')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full ${
            !query.tenant ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'
          }`}
        >
          {t('all')}
        </button>
        <button
          onClick={() => setParam('tenant', '1')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full ${
            query.tenant === '1' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300'
          }`}
        >
          {t('tenants_only')}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              <tr>
                <SortableTh label={t('customer_number')} field="customer_number" />
                <SortableTh label={t('name')} field="first_name" />
                <SortableTh label={t('email')} field="email" />
                <SortableTh label={t('phone')} field="phone" />
                <th className="text-left px-4 py-3 font-medium">{t('type')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data?.data.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{c.customer_number}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {c.first_name} {c.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.phone || '—'}</td>
                  <td className="px-4 py-3 space-x-1">
                    {!!c.is_buyer && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{t('buyer')}</span>
                    )}
                    {!!c.is_tenant && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t('tenant')}</span>
                    )}
                    {!c.is_buyer && !c.is_tenant && <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    <Link to={`/customers/${c.id}`} className="text-blue-600 hover:text-blue-800">{t('view')}</Link>
                    <Link to={`/customers/${c.id}/edit`} className="text-yellow-600 hover:text-yellow-700">{t('edit')}</Link>
                    <button onClick={() => destroy(c.id, `${c.first_name} ${c.last_name}`)} className="text-red-600 hover:text-red-700">{t('delete')}</button>
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">{t('no_customers_found')}</td>
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
