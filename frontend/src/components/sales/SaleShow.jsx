import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import StatusPill from '../StatusPill';

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{value ?? '—'}</p>
    </div>
  );
}

export default function SaleShow({ config }) {
  const { id } = useParams();
  const { t } = useApp();
  const [row, setRow] = useState(null);

  useEffect(() => {
    api.get(`/${config.endpoint}/${id}`).then(({ data }) => setRow(data));
  }, [id, config.endpoint]);

  if (!row) return <div className="text-sm text-gray-500">{t('loading')}</div>;

  const isRental = config.module === 'house_rental';
  const fmt = (n) => (n === null || n === undefined ? null : `$${Number(n).toLocaleString()}`);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t(config.detailsKey)}</h1>
          <button type="button">
            <StatusPill status={row.status} labels={{ available: t('available'), not_available: t('not_available') }} />
          </button>
        </div>
        <div className="space-x-3">
          <Link to={`/${config.endpoint}/${id}/edit`} className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg">
            {t('edit')}
          </Link>
          <Link to={`/${config.endpoint}`} className="inline-block px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            ← {t('back')}
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('record_information')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Detail label={t('property')} value={row.property?.title} />
            <Detail
              label={t('customer')}
              value={
                row.customer ? (
                  <Link to={`/customers/${row.customer_id}`} className="text-yellow-600 hover:text-yellow-700">
                    {row.customer.first_name} {row.customer.last_name}
                  </Link>
                ) : null
              }
            />
            <Detail label={t(config.amountLabel)} value={fmt(row[config.amountField])} />
            {isRental ? (
              <>
                <Detail label={t('commission')} value={fmt(row.commission)} />
                <Detail label={t('start_date')} value={row.start_date} />
              </>
            ) : (
              <>
                <Detail label={t('commission')} value={fmt(row.commission)} />
                <Detail label={t('sale_date')} value={row.sale_date} />
                <Detail label={t('payment_method')} value={row.payment_method ? String(row.payment_method).replace(/_/g, ' ') : null} />
                {config.module === 'land_sale' && <Detail label={t('land_size_m')} value={row.meters} />}
              </>
            )}
            <Detail label={t('location')} value={row.location} />
            <Detail label={t('registered_by')} value={row.registered_by ? `User #${row.registered_by}` : null} />
          </div>
          {row.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('notes')}</p>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-line">{row.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('payments')}</h3>
          {(row.payments || []).length === 0 && <p className="text-sm text-gray-500">{t('no_payments_recorded')}</p>}
          <ul>
            {(row.payments || []).map((p) => (
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
