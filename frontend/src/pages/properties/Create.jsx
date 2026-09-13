import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import PropertyForm from '../../components/PropertyForm';

const DB_TYPE = { 'land-sale': 'land', 'house-sale': 'house', 'house-rental': 'house' };
const META = {
  'land-sale': { emoji: '🌍', titleKey: 'add_land_sale', buttonKey: 'save_land_sale' },
  'house-sale': { emoji: '🏠', titleKey: 'add_house_sale', buttonKey: 'save_house_sale' },
  'house-rental': { emoji: '🔑', titleKey: 'add_house_rental', buttonKey: 'save_rental_property' },
  land: { emoji: '🌍', titleKey: 'add_land', buttonKey: 'save_land' },
  house: { emoji: '🏠', titleKey: 'add_house', buttonKey: 'save_house' },
  villa: { emoji: '🏘️', titleKey: 'add_villa', buttonKey: 'save_villa' },
  apartment: { emoji: '🏢', titleKey: 'add_apartment', buttonKey: 'save_apartment' },
  commercial: { emoji: '🏬', titleKey: 'add_commercial', buttonKey: 'save_commercial' },
};

export default function PropertyCreate() {
  const { type = 'land-sale' } = useParams();
  const { t, flashMessage } = useApp();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const dbType = DB_TYPE[type] || type;
  const meta = META[type] || META[dbType] || { emoji: '', titleKey: 'add_property', buttonKey: 'save' };

  const submit = async (form, image) => {
    setSaving(true);
    setErrors({});
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined && k !== 'country_code') fd.append(k, v);
      });
      if (form.country_code) fd.append('country_code', form.country_code);
      fd.append('type', type);
      if (image) fd.append('image', image);
      await api.post('/properties', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      flashMessage('success', `${dbType.charAt(0).toUpperCase()}${dbType.slice(1)} property created successfully.`);
      navigate('/properties');
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      flashMessage('error', err.response?.data?.message || 'Failed to create property.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link to="/properties/create" className="text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 mb-2 inline-block">&larr; {t('back_to_property_types')}</Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{meta.emoji} {t(meta.titleKey)}</h1>
      </div>
      <PropertyForm type={type} dbType={dbType} onSubmit={submit} errors={errors} saving={saving} submitLabel={t(meta.buttonKey)} cancelTo="/properties" />
    </div>
  );
}
