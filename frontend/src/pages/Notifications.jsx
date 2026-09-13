import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import Pagination from '../components/Pagination';

export default function Notifications() {
  const { t, flashMessage } = useApp();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const query = Object.fromEntries(params.entries());

  const load = () => {
    api.get('/notifications', { params: query }).then(({ data }) => setData(data));
  };

  useEffect(load, [params]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === null || value === undefined) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  };

  const markRead = async (n) => {
    try {
      await api.post(`/notifications/${n.id}/read`);
      load();
    } catch (err) {
      flashMessage('error', err.response?.data?.message || t('failed_mark_read'));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('notifications')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('stay_updated')}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setParam('unread', '1')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full ${
              query.unread === '1' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'
              }`}
            >
              {t('unread_only')}
            </button>
          <button
            onClick={() => setParam('unread', '')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full ${
              !query.unread ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'
            }`}
          >
            {t('all')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {(data?.data || []).map((n) => (
            <li key={n.id} className={`flex items-start justify-between gap-4 px-4 py-3 ${!n.read_at ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>
              <div>
                <p className={`text-sm ${!n.read_at ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {n.data_parsed?.title || n.title || 'Notification'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{n.data_parsed?.message || n.data_parsed?.body || ''}</p>
                <p className="text-xs text-gray-400 mt-1">{n.created_at}</p>
              </div>
              {!n.read_at && (
                <button onClick={() => markRead(n)} className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap">
                  {t('mark_as_read')}
                </button>
              )}
            </li>
          ))}
          {data?.data.length === 0 && (
            <li className="py-8 text-center text-gray-500">{t('no_notifications')}</li>
          )}
        </ul>
        <Pagination meta={data} onPage={(p) => setParam('page', p)} />
      </div>
    </div>
  );
}
