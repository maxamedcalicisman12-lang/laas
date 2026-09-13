import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import PropertyForm from '../../components/PropertyForm';

const DB_TYPE = { 'land-sale': 'land', 'house-sale': 'house', 'house-rental': 'house' };
const EMOJI = { house: '🏠', land: '🌍', apartment: '🏢', commercial: '🏬', villa: '🏘️' };

export default function PropertyEdit() {
  const { id } = useParams();
  const { t, flashMessage } = useApp();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/properties/${id}`).then(({ data }) => setProperty(data));
  }, [id]);

  if (!property) return <div className="text-sm text-gray-500">{t('loading')}</div>;

  const dbType = DB_TYPE[property.type] || property.type || 'house';
  const typeLabel = dbType.charAt(0).toUpperCase() + dbType.slice(1);
  const emoji = EMOJI[dbType] || '';

  const submit = async (form, image) => {
    setSaving(true);
    setErrors({});
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined && k !== 'country_code') fd.append(k, v);
      });
      if (form.country_code) fd.append('country_code', form.country_code);
      if (image) fd.append('image', image);
      await api.put(`/properties/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      flashMessage('success', `${typeLabel} property updated successfully.`);
      navigate(`/properties/${id}`);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      flashMessage('error', err.response?.data?.message || 'Failed to update property.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{emoji} {t('edit')} {typeLabel}</h1>
        <Link to={`/properties/${id}`} className="text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 font-medium">
          &larr; {t('back')}
        </Link>
      </div>
      <PropertyForm
        dbType={dbType}
        initial={property}
        onSubmit={submit}
        errors={errors}
        saving={saving}
        cancelTo={`/properties/${id}`}
        submitLabel={`${t('save')} ${typeLabel}`}
      />
    </div>
  );
}
