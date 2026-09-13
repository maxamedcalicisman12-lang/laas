import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';

export function UserForm({ initial = {}, errors = {}, saving, onSubmit, cancelTo = '/users', submitLabel = 'Save User' }) {
  const { t } = useApp();
  const [form, setForm] = useState({
    name: initial.name || '',
    email: initial.email || '',
    password: '',
    password_confirmation: '',
    phone: initial.phone || '',
    role: initial.role || '',
    is_active: initial.is_active === undefined ? true : !!initial.is_active,
  });

  const err = (name) => errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name][0]}</p>;
  const inputCls =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none';

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-2xl space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('full_name')} *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} required />
          {err('name')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email')} *</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} required />
          {err('email')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('password')} {!initial.id && '*'}
          </label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} required={!initial.id} />
          {err('password')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('confirm_password')} {!initial.id && '*'}</label>
          <input type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} className={inputCls} required={!initial.id} />
          {err('password_confirmation')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('phone')}</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          {err('phone')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('role')} *</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls} required>
            <option value="">{t('select_role')}</option>
            {initial.id && <option value="super_admin">{t('super_admin')}</option>}
            <option value="manager">{t('manager')}</option>
            <option value="agent">{t('agent')}</option>
            <option value="accountant">{t('accountant')}</option>
          </select>
          {err('role')}
        </div>
        <div>
          <label className="flex items-center space-x-3 mt-6">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{t('active')}</span>
          </label>
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

export default function UserCreate() {
  const { t, flashMessage } = useApp();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const submit = async (form) => {
    setSaving(true);
    setErrors({});
    try {
      await api.post('/users', form);
      flashMessage('success', 'User created successfully.');
      navigate('/users');
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      flashMessage('error', err.response?.data?.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('add_user')}</h1>
      </div>
      <UserForm onSubmit={submit} errors={errors} saving={saving} submitLabel={t('save_user')} />
    </div>
  );
}
