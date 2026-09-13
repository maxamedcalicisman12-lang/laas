import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{value ?? '—'}</p>
    </div>
  );
}

export default function UsedItemShow() {
  const { id } = useParams();
  const { t } = useApp();
  const [item, setItem] = useState(null);

  useEffect(() => {
    api.get(`/used-items/${id}`).then(({ data }) => setItem(data));
  }, [id]);

  if (!item) return <div className="text-sm text-gray-500">{t('loading')}</div>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{item.name}</h1>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              item.status === 'sold'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            }`}
          >
            {item.status === 'sold' ? t('sold') : t('available')}
          </span>
        </div>
        <Link to="/used-items" className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
          ← {t('back')}
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('item_information')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Detail label={t('category')} value={item.category} />
            <Detail label={t('condition')} value={<span className="capitalize">{item.condition}</span>} />
            <Detail label={t('price')} value={`$${Number(item.price).toLocaleString()}`} />
            <Detail
              label={t('owner')}
              value={
                item.customer ? (
                  <Link to={`/customers/${item.customer_id}`} className="text-yellow-600 hover:text-yellow-700">
                    {item.customer.first_name} {item.customer.last_name}
                  </Link>
                ) : null
              }
            />
            {item.status === 'sold' && (
              <>
                <Detail
                  label={t('sold_to')}
                  value={
                    item.buyer ? (
                      <Link to={`/customers/${item.sold_to}`} className="text-yellow-600 hover:text-yellow-700">
                        {item.buyer.first_name} {item.buyer.last_name}
                      </Link>
                    ) : null
                  }
                />
                <Detail label={t('sold_date')} value={item.sold_date} />
              </>
            )}
          </div>
          {item.description && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('description')}</p>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-line">{item.description}</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('payments')}</h3>
          {(item.payments || []).length === 0 && <p className="text-sm text-gray-500">{t('no_payments_recorded')}</p>}
          <ul>
            {(item.payments || []).map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <Link to={`/payments/${p.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">{p.reference_number}</Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{p.payment_date}</p>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">${Number(p.amount).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
