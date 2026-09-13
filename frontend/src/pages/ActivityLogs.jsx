import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import Pagination from '../components/Pagination';
import SortableTh from '../components/SortableTh';

const ACTION_COLORS = {
  created: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  deleted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  login: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  logout: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export default function ActivityLogs() {
  const { t } = useApp();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const query = Object.fromEntries(params.entries());

  const load = () => {
    api.get('/activity-logs', { params: query }).then(({ data }) => setData(data));
  };

  useEffect(load, [params]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === null || value === undefined) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('activity_logs')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('audit_trail_desc')}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 flex flex-wrap items-center gap-3">
        <select value={query.action || ''} onChange={(e) => setParam('action', e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
          <option value="">{t('all_actions')}</option>
          <option value="created">{t('created')}</option>
          <option value="updated">{t('updated')}</option>
          <option value="deleted">{t('deleted')}</option>
          <option value="login">{t('login')}</option>
          <option value="logout">{t('logout')}</option>
        </select>
        <select value={query.module || ''} onChange={(e) => setParam('module', e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
          <option value="">{t('all_modules')}</option>
          <option value="property">{t('property')}</option>
          <option value="customer">{t('customer')}</option>
          <option value="land_sale">{t('land_sale')}</option>
          <option value="house_rental">{t('house_rental')}</option>
          <option value="house_sale">{t('house_sale')}</option>
          <option value="used_item">{t('used_item')}</option>
          <option value="payment">{t('payment')}</option>
          <option value="cleaner">{t('cleaner')}</option>
          <option value="user">{t('user')}</option>
          <option value="backup">{t('backup')}</option>
          <option value="auth">{t('auth')}</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              <tr>
                <SortableTh label={t('action')} field="action" />
                <SortableTh label={t('module')} field="module" />
                <SortableTh label={t('description')} field="description" />
                <SortableTh label={t('user')} field="user_name" />
                <SortableTh label={t('time')} field="created_at" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {(data?.data || []).map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">{String(log.module || '').replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{log.description}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{log.user_name || `User #${log.user_id}`}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{log.created_at}</td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">{t('no_activity_logs')}</td>
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
