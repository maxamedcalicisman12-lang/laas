import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';

export function CleanerForm({ initial = {}, errors = {}, saving, onSubmit, cancelTo = '/cleaners', submitLabel = 'Save Cleaner' }) {
  const { t } = useApp();
  const [form, setForm] = useState({
    first_name: initial.first_name || '',
    last_name: initial.last_name || '',
    phone: initial.phone || '',
    email: initial.email || '',
    salary: initial.salary ?? '',
    status: initial.status || 'active',
    address: initial.address || '',
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('phone')}</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          {err('phone')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email')}</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
          {err('email')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('salary')}</label>
          <input type="number" min="0" step="0.01" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className={inputCls} />
          {err('salary')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status')} *</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </select>
          {err('status')}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('address')}</label>
          <textarea rows="2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
          {err('address')}
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

export default function CleanerCreate() {
  const { t, flashMessage } = useApp();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const submit = async (form) => {
    setSaving(true);
    setErrors({});
    try {
      await api.post('/cleaners', form);
      flashMessage('success', 'Cleaner created successfully.');
      navigate('/cleaners');
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      flashMessage('error', err.response?.data?.message || 'Failed to create cleaner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('add_cleaner')}</h1>
      </div>
      <CleanerForm onSubmit={submit} errors={errors} saving={saving} submitLabel={t('save_cleaner')} />
    </div>
  );
}
