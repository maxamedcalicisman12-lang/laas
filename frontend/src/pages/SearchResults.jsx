import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useApp } from '../context/AppContext';

const TYPE_LABELS = {
  property: 'properties',
  customer: 'customers',
  payment: 'payments',
};

export default function SearchResults() {
  const { t } = useApp();
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setResults(null);
    setError(null);
    api
      .get('/search', { params: { q } })
      .then(({ data }) => setResults(data.results || []))
      .catch((err) => setError(err.response?.data?.message || t('search_failed')));
  }, [q]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('search_results')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t('results_for')} "<span className="font-medium text-gray-900 dark:text-white">{q}</span>"
      </p>

      {error && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500">
          {error}
        </div>
      )}

      {!results && !error && <div className="text-sm text-gray-500">{t('searching')}</div>}

      {results && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {results.map((r, i) => (
              <li key={i}>
                <Link to={r.url} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div>
                    <p className="text-sm font-medium text-blue-600 hover:text-blue-800">{r.title}</p>
                    {r.description && <p className="text-xs text-gray-500 dark:text-gray-400">{r.description}</p>}
                  </div>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {TYPE_LABELS[r.type] ? t(TYPE_LABELS[r.type]) : r.type}
                  </span>
                </Link>
              </li>
            ))}
            {results.length === 0 && (
              <li className="py-8 text-center text-gray-500">{t('no_results_found')} "{q}".</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
