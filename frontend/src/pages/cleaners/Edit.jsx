import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import { CleanerForm } from './Create';

export default function CleanerEdit() {
  const { id } = useParams();
  const { t, flashMessage } = useApp();
  const navigate = useNavigate();
  const [cleaner, setCleaner] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/cleaners/${id}`).then(({ data }) => setCleaner(data));
  }, [id]);

  if (!cleaner) return <div className="text-sm text-gray-500">{t('loading')}</div>;

  const submit = async (form) => {
    setSaving(true);
    setErrors({});
    try {
      await api.put(`/cleaners/${id}`, form);
      flashMessage('success', 'Cleaner updated successfully.');
      navigate(`/cleaners/${id}`);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      flashMessage('error', err.response?.data?.message || 'Failed to update cleaner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('edit_cleaner')}</h1>
      </div>
      <CleanerForm initial={cleaner} onSubmit={submit} errors={errors} saving={saving} cancelTo={`/cleaners/${id}`} submitLabel={t('update_cleaner')} />
    </div>
  );
}
