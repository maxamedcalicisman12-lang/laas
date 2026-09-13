import { useApp } from '../context/AppContext';

export default function Pagination({ meta, onPage }) {
  const { t } = useApp();
  if (!meta || meta.last_page <= 1) return null;

  const pages = [];
  const start = Math.max(1, meta.current_page - 2);
  const end = Math.min(meta.last_page, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
      <p className="text-sm text-gray-700 dark:text-gray-300">
        {t('showing')} {meta.from} {t('to')} {meta.to} {t('of')} {meta.total} {t('results')}
      </p>
      <div className="flex space-x-1">
        <button
          onClick={() => onPage(meta.current_page - 1)}
          disabled={meta.current_page === 1}
          className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
        >
          &laquo;
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`px-4 py-2 text-sm rounded-md border ${
              p === meta.current_page
                ? 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 font-medium'
                : 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200'
            } border-gray-300 dark:border-gray-600`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(meta.current_page + 1)}
          disabled={meta.current_page === meta.last_page}
          className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
        >
          &raquo;
        </button>
      </div>
    </div>
  );
}
