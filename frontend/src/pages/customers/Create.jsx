import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';

export function CustomerForm({ initial = {}, errors = {}, saving, onSubmit, cancelTo = '/customers', submitLabel = 'Save Customer' }) {
  const { t } = useApp();
  const [form, setForm] = useState({
    first_name: initial.first_name || '',
    last_name: initial.last_name || '',
    email: initial.email || '',
    phone: initial.phone || '',
    address: initial.address || '',
    id_type: initial.id_type || '',
    is_buyer: !!initial.is_buyer,
    is_tenant: !!initial.is_tenant,
    notes: initial.notes || '',
  });

  const err = (name) => errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name][0]}</p>;
  const inputCls =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none';

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-2xl space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('first_name')} *</label>
          <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputCls} required />
          {err('first_name')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('last_name')} *</label>
          <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputCls} required />
          {err('last_name')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email')}</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
          {err('email')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('phone')}</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          {err('phone')}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('address')}</label>
          <textarea rows="2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
          {err('address')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('id_type')}</label>
          <input value={form.id_type} onChange={(e) => setForm({ ...form, id_type: e.target.value })} className={inputCls} />
          {err('id_type')}
        </div>
        <div></div>
        <div className="md:col-span-2">
          <label className="flex items-center space-x-3">
            <input type="checkbox" checked={form.is_buyer} onChange={(e) => setForm({ ...form, is_buyer: e.target.checked })} className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{t('this_customer_is_a_buyer')}</span>
          </label>
          <label className="flex items-center space-x-3 mt-2">
            <input type="checkbox" checked={form.is_tenant} onChange={(e) => setForm({ ...form, is_tenant: e.target.checked })} className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{t('this_customer_is_a_tenant')}</span>
          </label>
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

export default function CustomerCreate() {
  const { t, flashMessage } = useApp();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const submit = async (form) => {
    setSaving(true);
    setErrors({});
    try {
      await api.post('/customers', form);
      flashMessage('success', 'Customer created successfully.');
      navigate('/customers');
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      flashMessage('error', err.response?.data?.message || 'Failed to create customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('add_customer')}</h1>
      </div>
      <CustomerForm onSubmit={submit} errors={errors} saving={saving} submitLabel={t('save_customer')} />
    </div>
  );
}
