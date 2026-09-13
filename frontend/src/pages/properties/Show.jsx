import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';

const TYPE_COLORS = {  land: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  house: 'bg-blue-600 text-white',
  apartment: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  commercial: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  villa: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
};

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{value || '—'}</p>
    </div>
  );
}

export default function PropertyShow() {
  const { id } = useParams();
  const { t } = useApp();
  const [property, setProperty] = useState(null);

  useEffect(() => {
    api.get(`/properties/${id}`).then(({ data }) => setProperty(data));
  }, [id]);

  if (!property) return <div className="text-sm text-gray-500">{t('loading')}</div>;

  const image = property.images_parsed?.[0];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{property.title}</h1>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${TYPE_COLORS[property.type] || 'bg-gray-100 text-gray-800'}`}>
            {property.type}
          </span>
        </div>
        <div className="space-x-3">
          <Link to={`/properties/${id}/edit`} className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg">
            {t('edit')}
          </Link>
          <Link to="/properties" className="inline-block px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            ← {t('back')}
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-3xl">
        {image && (
          <img src={`/storage/${image}`} alt={property.title} className="w-full max-h-80 object-cover rounded-lg mb-6" />
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <Detail label={t('owner_of_property')} value={property.owner} />
          <Detail label={t('status')} value={<span className="capitalize">{String(property.status).replace(/_/g, ' ')}</span>} />
          <Detail label={t('price')} value={`$${Number(property.price || 0).toLocaleString()}`} />
          <Detail
            label={t('phone')}
            value={
              property.phone ? (
                <a href={`tel:${property.phone}`} className="text-yellow-600 hover:text-yellow-700">{property.phone}</a>
              ) : null
            }
          />
          <Detail label={t('area')} value={property.area} />
          {(property.type === 'house' || property.type === 'villa') && (
            <>
              <Detail label={t('house_type')} value={property.house_type} />
              <Detail label={t('bedrooms')} value={property.bedrooms} />
              <Detail label={t('bathrooms')} value={property.bathrooms} />
            </>
          )}
          {property.type === 'land' && <Detail label={t('land_type')} value={property.land_type} />}
          <Detail label={t('location')} value={property.location} />
        </div>

        {property.description && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('description')}</p>
            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-line">{property.description}</p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-6 max-w-3xl">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('payment_history')}</h3>
          <Link to="/payments" className="text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400">{t('view_all')}</Link>
        </div>
        <div className="p-5">
          {property.payments && property.payments.length > 0 ? (
            <ul>
              {property.payments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{payment.reference_number}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {payment.payment_date} · {String(payment.payment_method || '').replace(/_/g, ' ')} · {payment.customer_name || 'N/A'}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    ${Number(payment.amount || 0).toLocaleString()}
                    <span className={`ml-2 text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                      payment.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : payment.status === 'pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                      : payment.status === 'refunded' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">{t('no_payments_yet')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
