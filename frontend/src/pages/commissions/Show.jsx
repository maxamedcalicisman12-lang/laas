import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';

const TYPE_LABELS = {
  land_sale: 'land_sale',
  house_sale: 'house_sale',
  house_rental: 'house_rental',
};

function Detail({ label, value }) {
  return (
    <div>
      <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white font-medium">{value || '—'}</span>
    </div>
  );
}

export default function CommissionShow() {
  const { id } = useParams();
  const { t } = useApp();
  const [row, setRow] = useState(null);

  useEffect(() => {
    api.get(`/commissions/${id}`).then(({ data }) => setRow(data)).catch(() => {});
  }, [id]);

  if (!row) return <div className="text-sm text-gray-500">{t('loading')}</div>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('commission')} #{row.id}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('commission_record_details')}</p>
        </div>
        <Link to="/commissions" className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
          {t('back')}
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Detail label={t('type')} value={t(TYPE_LABELS[row.commission_type] || row.commission_type)} />
          <Detail label={t('status')} value={row.status} />
          <Detail label={t('customer')} value={row.customer ? `${row.customer.first_name} ${row.customer.last_name}` : null} />
          <Detail label={t('property')} value={row.property?.title} />
          <Detail label={t('amount')} value={row.amount ? `$${Number(row.amount).toLocaleString()}` : null} />
          <Detail label={t('rate')} value={row.rate ? `${row.rate}%` : null} />
          <Detail label={t('commission')} value={row.commission ? `$${Number(row.commission).toLocaleString()}` : null} />
          <Detail label={t('registered_by')} value={row.registered_by_user?.name} />
          <Detail label={t('location')} value={row.property?.location} />
          <Detail label={t('date')} value={row.created_at} />
        </div>
      </div>
    </div>
  );
}