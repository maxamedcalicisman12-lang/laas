import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';

const CATEGORIES = ['furniture', 'electronics', 'appliances', 'other'];
const CONDITIONS = ['new', 'good', 'fair', 'poor'];

export default function UsedItemCreate() {
  const { t, flashMessage } = useApp();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    condition: 'new',
    status: 'available',
    quantity: 1,
    description: '',
  });

  const err = (name) => errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name][0]}</p>;
  const inputCls =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none';

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api.post('/used-items', form);
      flashMessage('success', 'Used item created successfully.');
      navigate('/used-items');
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      flashMessage('error', err.response?.data?.message || 'Failed to create used item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('add_used_item')}</h1>
      </div>

      <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('name')} *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} required />
            {err('name')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('category')} *</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} required>
              <option value="">{t('select_category')}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            {err('category')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('price')} *</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} required />
            {err('price')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('condition')} *</label>
            <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className={inputCls}>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            {err('condition')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status')} *</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
              <option value="available">{t('available')}</option>
              <option value="sold">{t('sold')}</option>
            </select>
            {err('status')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('quantity')}</label>
            <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputCls} />
            {err('quantity')}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('description')}</label>
            <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
            {err('description')}
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {saving ? t('saving') : t('save_used_item')}
          </button>
          <Link to="/used-items" className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            {t('cancel')}
          </Link>
        </div>
      </form>
    </div>
  );
}
