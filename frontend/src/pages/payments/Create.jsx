import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';

export function PaymentForm({ initial = {}, errors = {}, saving, onSubmit, cancelTo = '/payments', submitLabel = 'Save Payment' }) {
  const { t } = useApp();
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({
    property_id: initial.property_id ? String(initial.property_id) : '',
    amount: initial.amount ?? '',
    payment_method: initial.payment_method || '',
    payment_date: initial.payment_date || new Date().toISOString().slice(0, 10),
    status: initial.status || 'pending',
    notes: initial.notes || '',
  });

  useEffect(() => {
    api.get('/payments/meta/create').then(({ data }) => setProperties(data.properties || []));
  }, []);

  const err = (name) => errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name][0]}</p>;
  const inputCls =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none';

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-2xl space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('property')} *</label>
          <select value={form.property_id} onChange={(e) => {
            const val = e.target.value;
            const pr = properties.find((p) => String(p.id) === val);
            setForm((prev) => ({
              ...prev,
              property_id: val,
              amount: prev.amount === '' && pr && pr.price != null ? pr.price : prev.amount,
            }));
          }} className={inputCls} required>
            <option value="">{t('select_property')}</option>
            {properties.map((pr) => (
              <option key={pr.id} value={pr.id}>{pr.title}{pr.location ? ` — ${pr.location}` : ''}</option>
            ))}
          </select>
          {err('property_id')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('amount')} *</label>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} required />
          {err('amount')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('payment_method')} *</label>
          <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className={inputCls} required>
            <option value="">{t('select_method')}</option>
            <option value="zaad">Zaad</option>
            <option value="sahal">Sahal</option>
            <option value="edahab">E-Dahab</option>
            <option value="mycash">MyCash</option>
            <option value="evc_plus">EVC Plus</option>
            <option value="cash">Cash</option>
          </select>
          {err('payment_method')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('payment_date')} *</label>
          <input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} className={inputCls} required />
          {err('payment_date')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status')} *</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
            <option value="pending">{t('pending')}</option>
            <option value="completed">{t('completed')}</option>
            <option value="failed">{t('failed')}</option>
            <option value="refunded">{t('refunded')}</option>
          </select>
          {err('status')}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notes')}</label>
          <textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
          {err('notes')}
        </div>
      </div>

      <div className="mt-6 flex space-x-3">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
          {saving ? t('saving') : submitLabel}
        </button>
        <Link to={cancelTo} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
          {t('cancel')}
        </Link>
      </div>
    </form>
  );
}

export default function PaymentCreate() {
  const { t, flashMessage } = useApp();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const submit = async (form) => {
    setSaving(true);
    setErrors({});
    try {
      await api.post('/payments', form);
      flashMessage('success', 'Payment created successfully.');
      navigate('/payments');
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      flashMessage('error', err.response?.data?.message || 'Failed to create payment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('add_payment')}</h1>
      </div>
      <PaymentForm onSubmit={submit} errors={errors} saving={saving} submitLabel={t('save_payment')} />
    </div>
  );
}
