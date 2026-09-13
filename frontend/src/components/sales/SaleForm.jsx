import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';

export function SaleForm({ config, initial = {}, errors = {}, saving, onSubmit, cancelTo, submitLabel = 'Save' }) {
  const { t } = useApp();
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState({
    property_id: initial.property_id ? String(initial.property_id) : '',
    customer_id: initial.customer_id ? String(initial.customer_id) : '',
    [config.amountField]: initial[config.amountField] ?? '',
    deposit: initial.deposit ?? '',
    commission: initial.commission ?? '',
    meters: initial.meters || '',
    location: initial.location || '',
    sale_date: initial.sale_date || '',
    start_date: initial.start_date || '',
    end_date: initial.end_date || '',
    payment_method: initial.payment_method || '',
    status: initial.status || 'available',
    notes: initial.notes || '',
  });

  useEffect(() => {
    api.get(`/${config.endpoint}/meta/create`).then(({ data }) => setMeta(data));
  }, [config.endpoint]);

  const isRental = config.module === 'house_rental';
  const isLand = config.module === 'land_sale';

  const commissionRate = parseFloat(meta?.commission_rate || 0);

  const computeCommission = (amount) => {
    if (amount === '' || amount === null || amount === undefined) return '';
    if (!commissionRate) return '';
    return (parseFloat(amount) * commissionRate / 100).toFixed(2);
  };

  const applyPropertyFill = (p) => {
    if (!p) return;
    const patch = {};
    if (config.amountField === 'rent_amount') patch.rent_amount = p.price;
    else patch.sale_price = p.price;
    if (isLand) patch.meters = p.area || '';
    patch.location = p.location || '';
    if (!isRental) patch.sale_date = new Date().toISOString().slice(0, 10);
    else patch.start_date = new Date().toISOString().slice(0, 10);
    patch.notes = p.description || '';
    patch.status = ['available', 'not_available'].includes(p.status) ? p.status : 'not_available';
    setForm((f) => ({ ...f, ...patch }));
  };

  const onPropertyChange = (id) => {
    setForm((f) => ({ ...f, property_id: id }));
    if (id) api.get(`/properties/${id}`).then(({ data }) => applyPropertyFill(data.property || data));
  };

  useEffect(() => {
    if (initial.property_id && meta) {
      api.get(`/properties/${initial.property_id}`).then(({ data }) => applyPropertyFill(data.property || data));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta]);

  useEffect(() => {
    setForm((f) => {
      const c = computeCommission(f[config.amountField]);
      return String(f.commission) === String(c) ? f : { ...f, commission: c };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form[config.amountField], meta]);

  const err = (name) => errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name][0]}</p>;
  const inputCls =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none';
  const readonlyCls =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-100 dark:bg-gray-600 dark:text-white cursor-not-allowed focus:ring-2 focus:ring-yellow-400 outline-none';

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-2xl space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('property')} *</label>
          <select value={form.property_id} onChange={(e) => onPropertyChange(e.target.value)} className={inputCls} required>
            <option value="">{t('select_property')}</option>
            {(meta?.properties || []).map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          {err('property_id')}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customer')} *</label>
          <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className={inputCls} required>
            <option value="">{t('select_customer')}</option>
            {(meta?.customers || []).map((c) => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
          {err('customer_id')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t(config.amountLabel)} *</label>
          <input type="number" min="0" step="0.01" value={form[config.amountField]} onChange={(e) => setForm({ ...form, [config.amountField]: e.target.value })} className={inputCls} required />
          {err(config.amountField)}
        </div>

        {isLand && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('land_size_w_h')}</label>
            <input value={form.meters} onChange={(e) => setForm({ ...form, meters: e.target.value })} placeholder={t('land_size_hint')} className={inputCls} />
            {err('meters')}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('commission')}{commissionRate > 0 ? ` (${commissionRate}%)` : ''}</label>
          <input type="number" min="0" step="0.01" value={form.commission} readOnly className={readonlyCls} />
          {err('commission')}
        </div>

        <div className={isRental ? 'md:col-span-2' : ''}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('location')}</label>
          <input value={form.location} readOnly className={readonlyCls} />
        </div>

        {!isRental ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('sale_date')}</label>
              <input type="date" value={form.sale_date} onChange={(e) => setForm({ ...form, sale_date: e.target.value })} className={inputCls} />
              {err('sale_date')}
            </div>
            {config.module !== 'house_sale' && initial.id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('payment_method')}</label>
                <input value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className={inputCls} />
                {err('payment_method')}
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('start_date')} *</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputCls} required />
              {err('start_date')}
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status')} *</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
            <option value="available">{t('available')}</option>
            <option value="not_available">{t('not_available')}</option>
          </select>
          {err('status')}
        </div>

        {config.hasNotes !== false && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notes')}</label>
            <textarea rows={isRental ? '2' : '3'} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
            {err('notes')}
          </div>
        )}
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

export default SaleForm;

export function useSaleCreate(config) {
  const { flashMessage } = useApp();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const submit = async (form) => {
    setSaving(true);
    setErrors({});
    try {
      await api.post(`/${config.endpoint}`, form);
      flashMessage('success', `${config.label} created successfully.`);
      navigate(`/${config.endpoint}`);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      flashMessage('error', err.response?.data?.message || `Failed to create ${config.label.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  };

  return { submit, errors, saving };
}

export function useSaleEdit(config) {
  const { id } = useParams();
  const { flashMessage } = useApp();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/${config.endpoint}/${id}/edit-meta`).then(({ data }) => setRecord(data.record));
  }, [id, config.endpoint]);

  const submit = async (form) => {
    setSaving(true);
    setErrors({});
    try {
      await api.put(`/${config.endpoint}/${id}`, form);
      flashMessage('success', `${config.label} updated successfully.`);
      navigate(`/${config.endpoint}/${id}`);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      flashMessage('error', err.response?.data?.message || `Failed to update ${config.label.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  };

  return { id, record, submit, errors, saving };
}
