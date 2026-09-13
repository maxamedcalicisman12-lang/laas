import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import { CustomerForm } from './Create';

export default function CustomerEdit() {
  const { id } = useParams();
  const { t, flashMessage } = useApp();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/customers/${id}`).then(({ data }) => setCustomer(data));
  }, [id]);

  if (!customer) return <div className="text-sm text-gray-500">{t('loading')}</div>;

  const submit = async (form) => {
    setSaving(true);
    setErrors({});
    try {
      await api.put(`/customers/${id}`, form);
      flashMessage('success', 'Customer updated successfully.');
      navigate(`/customers/${id}`);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      flashMessage('error', err.response?.data?.message || 'Failed to update customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('edit_customer')}</h1>
      </div>
      <CustomerForm initial={customer} onSubmit={submit} errors={errors} saving={saving} cancelTo={`/customers/${id}`} submitLabel={t('update_customer')} />
    </div>
  );
}
