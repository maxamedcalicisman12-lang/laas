import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{value || '—'}</p>
    </div>
  );
}

export default function CleanerShow() {
  const { id } = useParams();
  const { t } = useApp();
  const [cleaner, setCleaner] = useState(null);

  useEffect(() => {
    api.get(`/cleaners/${id}`).then(({ data }) => setCleaner(data));
  }, [id]);

  if (!cleaner) return <div className="text-sm text-gray-500">{t('loading')}</div>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {cleaner.first_name} {cleaner.last_name}
          </h1>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              cleaner.status === 'active'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {cleaner.status === 'active' ? t('active') : t('inactive')}
          </span>
        </div>
        <div className="space-x-3">
          <Link to={`/cleaners/${id}/edit`} className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg">
            {t('edit')}
          </Link>
          <Link to="/cleaners" className="inline-block px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            ← {t('back')}
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
        <div className="grid md:grid-cols-2 gap-4">
          <Detail label={t('email')} value={cleaner.email} />
          <Detail label={t('phone')} value={cleaner.phone} />
          <Detail label={t('salary')} value={`$${Number(cleaner.salary || 0).toLocaleString()}`} />
          <Detail label={t('registered_by')} value={cleaner.registered_by ? `User #${cleaner.registered_by}` : null} />
        </div>
        {cleaner.address && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('address')}</p>
            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-line">{cleaner.address}</p>
          </div>
        )}
        {cleaner.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('notes')}</p>
            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-line">{cleaner.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
