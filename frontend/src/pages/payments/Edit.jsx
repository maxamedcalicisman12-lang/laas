import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import { PaymentForm } from './Create';

export default function PaymentEdit() {
  const { id } = useParams();
  const { t, flashMessage } = useApp();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/payments/${id}`).then(({ data }) => setPayment(data));
  }, [id]);

  if (!payment) return <div className="text-sm text-gray-500">{t('loading')}</div>;

  const submit = async (form) => {
    setSaving(true);
    setErrors({});
    try {
      await api.put(`/payments/${id}`, form);
      flashMessage('success', 'Payment updated successfully.');
      navigate(`/payments/${id}`);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      flashMessage('error', err.response?.data?.message || 'Failed to update payment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('edit_payment')}</h1>
      </div>
      <PaymentForm initial={payment} onSubmit={submit} errors={errors} saving={saving} cancelTo={`/payments/${id}`} submitLabel={t('update_payment')} />
    </div>
  );
}
