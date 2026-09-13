import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import Pagination from '../../components/Pagination';
import SortableTh from '../../components/SortableTh';

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const PAYABLE_LABELS = {
  land_sale: 'land_sale',
  house_sale: 'house_sale',
  house_rental: 'house_rental',
  used_item: 'used_item',
};

export default function PaymentsIndex() {
  const { t, confirm, flashMessage } = useApp();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState(params.get('search') || '');
  const query = Object.fromEntries(params.entries());

  const load = () => {
    api.get('/payments', { params: query }).then(({ data }) => setData(data));
  };

  useEffect(load, [params]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === null || value === undefined) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  };

  const destroy = (id, ref) => {
    confirm(`Delete payment ${ref}?`, async () => {
      try {
        await api.delete(`/payments/${id}`);
        flashMessage('success', 'Payment deleted successfully.');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('all_payments')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('track_incoming_payments')}</p>
        </div>
        <Link to="/payments/create" className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg">
          + {t('add_payment')}
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
          placeholder={t('search_payments')}
          className="w-2/5 min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none"
        />
        <select value={query.status || ''} onChange={(e) => setParam('status', e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
          <option value="">{t('all_statuses')}</option>
          <option value="completed">{t('completed')}</option>
          <option value="pending">{t('pending')}</option>
          <option value="failed">{t('failed')}</option>
          <option value="refunded">{t('refunded')}</option>
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
                <SortableTh label={t('reference_no')} field="reference_number" />
                <SortableTh label={t('customer')} field="customer_name" />
                <SortableTh label={t('amount')} field="amount" />
                <SortableTh label={t('method')} field="payment_method" />
                <SortableTh label={t('date')} field="payment_date" />
                <th className="text-left px-4 py-3 font-medium">{t('for')}</th>
                <SortableTh label={t('status')} field="status" />
                <th className="text-left px-4 py-3 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data?.data.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <Link to={`/payments/${p.id}`} className="font-mono text-xs text-blue-600 hover:text-blue-800">{p.reference_number}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{p.customer_name || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">${Number(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">{String(p.payment_method).replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.payment_date}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {p.payable && p.payable.__property_title ? (
                      <Link to={`/${p.payable.__payable_table.replace(/_/g, '-')}/${p.payable_id}`} className="hover:text-yellow-600">
                        {p.payable.__property_title}
                      </Link>
                    ) : p.payable ? (
                      <Link to={`/${p.payable.__payable_table.replace(/_/g, '-')}/${p.payable_id}`} className="hover:text-yellow-600">
                        {t(PAYABLE_LABELS[p.payable_type] || p.payable_type)} #{p.payable_id}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${STATUS_COLORS[p.status] || ''}`}>{t(p.status)}</span>
                  </td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    <Link to={`/payments/${p.id}`} className="text-blue-600 hover:text-blue-800">{t('view')}</Link>
                    <Link to={`/payments/${p.id}/edit`} className="text-yellow-600 hover:text-yellow-700">{t('edit')}</Link>
                    <button onClick={() => destroy(p.id, p.reference_number)} className="text-red-600 hover:text-red-700">{t('delete')}</button>
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-500">{t('no_payments_found')}</td>
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
