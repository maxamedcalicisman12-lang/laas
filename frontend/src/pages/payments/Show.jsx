import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const PAYABLE_LABELS = {
  land_sale: 'land_sale',
  house_sale: 'house_sale',
  house_rental: 'house_rental',
  used_item: 'used_item',
};

export default function PaymentShow() {
  const { id } = useParams();
  const { t, flashMessage } = useApp();
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    api.get(`/payments/${id}`).then(({ data }) => setPayment(data));
  }, [id]);

  if (!payment) return <div className="text-sm text-gray-500">{t('loading')}</div>;

  const printReceipt = () => {
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) {
      flashMessage('error', 'Please allow pop-ups to print the receipt.');
      return;
    }
    const p = payment;
    w.document.write(`
      <html>
        <head>
          <title>${t('payment_receipt')} ${p.reference_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1c5197; padding-bottom: 16px; }
            .logo { font-size: 24px; font-weight: bold; color: #1c5197; }
            h1 { font-size: 20px; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            td { padding: 8px 0; }
            td:first-child { color: #666; width: 40%; }
            .total { border-top: 2px solid #eee; font-size: 18px; font-weight: bold; }
            .footer { margin-top: 48px; text-align: center; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">LAAS Real Estate</div>
            <div style="text-align:right">
              <h1>${t('payment_receipt')}</h1>
              <p style="margin:4px 0">${p.reference_number}</p>
            </div>
          </div>
          <table>
            <tr><td>${t('customer')}</td><td>${p.customer ? `${p.customer.first_name} ${p.customer.last_name}` : '—'}</td></tr>
            <tr><td>${t('payment_date')}</td><td>${p.payment_date}</td></tr>
            <tr><td>${t('payment_method')}</td><td>${String(p.payment_method).replace(/_/g, ' ')}</td></tr>
            ${p.payable ? `<tr><td>${t('for')}</td><td>${p.payable.__property_title || `${t(PAYABLE_LABELS[p.payable_type] || p.payable_type)} #${p.payable_id}`}</td></tr>` : ''}
            <tr><td>${t('status')}</td><td>${String(p.status).toUpperCase()}</td></tr>
            <tr class="total"><td>${t('amount_paid')}</td><td>$${Number(p.amount).toLocaleString()}</td></tr>
          </table>
          <div class="footer">${t('receipt_footer')}${new Date().toLocaleString()}.</div>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{payment.reference_number}</h1>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[payment.status] || ''}`}>{payment.status}</span>
        </div>
        <div className="space-x-3">
          <button onClick={printReceipt} className="inline-block px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg">
            🖨 {t('print_receipt')}
          </button>
          <Link to={`/payments/${id}/edit`} className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg">
            {t('edit')}
          </Link>
          <Link to="/payments" className="inline-block px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            ← {t('back')}
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('customer')}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
              {payment.customer ? (
                <Link to={`/customers/${payment.customer_id}`} className="text-yellow-600 hover:text-yellow-700">
                  {payment.customer.first_name} {payment.customer.last_name}
                </Link>
              ) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('amount')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">${Number(payment.amount).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('payment_method')}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5 capitalize">{String(payment.payment_method).replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('payment_date')}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{payment.payment_date}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('linked_record')}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
              {payment.payable
                ? `${t(PAYABLE_LABELS[payment.payable_type] || payment.payable_type)} #${payment.payable_id}`
                : '—'}
            </p>
            {payment.payable?.__property_title && (
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mt-0.5">
                {payment.payable.__property_title}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('processed_by')}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{payment.processed_by_user?.name || '—'}</p>
          </div>
        </div>

        {payment.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('notes')}</p>
            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-line">{payment.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
