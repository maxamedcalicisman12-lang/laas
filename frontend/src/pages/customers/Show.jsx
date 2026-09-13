import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import StatusPill from '../../components/StatusPill';

export default function CustomerShow() {
  const { id } = useParams();
  const { t } = useApp();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    api.get(`/customers/${id}`).then(({ data }) => setCustomer(data));
  }, [id]);

  if (!customer) return <div className="text-sm text-gray-500">{t('loading')}</div>;

  const fmt = (n) => `$${Number(n || 0).toLocaleString()}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {customer.first_name} {customer.last_name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{customer.customer_number}</p>
        </div>
        <div className="space-x-3">
          <Link to={`/customers/${id}/edit`} className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg">
            {t('edit')}
          </Link>
          <Link to="/customers" className="inline-block px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            ← {t('back')}
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Contact info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('contact_information')}</h3>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('email')}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.email || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('phone')}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('address')}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.address || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('id_type')}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.id_type || '—'}</p>
          </div>
          <div className="flex space-x-2 pt-2">
            {!!customer.is_buyer && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{t('buyer')}</span>
            )}
            {!!customer.is_tenant && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t('tenant')}</span>
            )}
          </div>
          {customer.notes && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('notes')}</p>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-line">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Related records */}
        <div className="lg:col-span-2 space-y-5">
          <RelatedCard title={t('land_purchases')} rows={customer.land_sales} render={(r) => ({
            title: r.property_title || `#${r.id}`,
            sub: r.location,
            right: fmt(r.sale_price),
          })} />
          <RelatedCard title={t('rentals')} rows={customer.house_rentals} render={(r) => ({
            title: r.property_title || `#${r.id}`,
            sub: `${fmt(r.rent_amount)}/mo`,
            right: <StatusPill status={r.status} />,
          })} />
          <RelatedCard title={t('house_purchases')} rows={customer.house_sales} render={(r) => ({
            title: r.property_title || `#${r.id}`,
            sub: r.location,
            right: fmt(r.sale_price),
          })} />
          <RelatedCard title={t('payment_history')} rows={customer.payments} render={(r) => ({
            title: r.__property_title || r.reference_number || `#${r.id}`,
            sub: `${[r.reference_number, r.payment_date, String(r.payment_method || '').replace(/_/g, ' ')].filter(Boolean).join(' · ')}`,
            right: fmt(r.amount),
          })} />
        </div>
      </div>
    </div>
  );
}

function RelatedCard({ title, rows, render }) {
  const { t } = useApp();
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
      {(rows || []).length === 0 && <p className="text-sm text-gray-500">{t('no_records')}</p>}
      <ul>
        {(rows || []).map((r) => {
          const view = render(r);
          return (
            <li key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{view.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{view.sub}</p>
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{view.right}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
