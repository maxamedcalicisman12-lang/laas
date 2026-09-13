import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import PhoneInput from './PhoneInput';

const NEIGHBORHOODS = [
  'Daami', 'Ex Control', 'Cadhootay', 'Saamaley', 'Sayidka',
  'Dhakhtarka Wayn', 'Jaamalaaye', 'Dhiif', 'Farxaskulle', 'Buulaha Dowladda',
];
const LAND_TYPES = ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Mixed-Use'];
const HOUSE_TYPES = ['1. Baloodh', '2. Nus', '3. Feedhabuur', '4. Labo Qol', '5. Hal Qol', '6. Others'];
const VILLA_TYPES = ['Standard Villa', 'Luxury Villa', 'Beachfront Villa', 'Golf Villa', 'Estate'];

export default function PropertyForm({ type = 'house', dbType = 'house', initial = {}, errors = {}, saving, onSubmit, cancelTo = '/properties', submitLabel = 'Save' }) {
  const { t } = useApp();
  const [form, setForm] = useState({
    title: initial.title || '',
    owner: initial.owner || '',
    phone: initial.phone_number !== undefined ? initial.phone_number : (initial.phone ? String(initial.phone).replace(/^\+\d{1,4}/, '') : ''),
    country_code: initial.country_code || (initial.phone ? String(initial.phone).match(/^\+\d{1,4}/)?.[0] : null) || '+252',
    land_type: initial.land_type || '',
    house_type: initial.house_type || '',
    bedrooms: initial.bedrooms ?? '',
    bathrooms: initial.bathrooms ?? '',
    floors: initial.floors ?? '',
    area: initial.area || '',
    price: initial.price ?? '',
    status: initial.status || 'available',
    location: initial.location || '',
    address: initial.address || '',
    description: initial.description || '',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (initial.images_parsed?.[0]) setPreview(`/storage/${initial.images_parsed[0]}`);
  }, [initial]);

  const isLand = dbType === 'land';
  const isVilla = dbType === 'villa';
  const isHouse = dbType === 'house';
  const needsRooms = !['land', 'commercial'].includes(dbType);
  const roomsRequired = isHouse || isVilla;
  const locationIsSelect = ['house', 'land'].includes(dbType);

  const err = (name) => errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name][0]}</p>;
  const inputCls =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form, image);
      }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-3xl space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('property_title')} *</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} required />
          {err('title')}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('owner_of_property')}</label>
          <input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} className={inputCls} />
          {err('owner')}
        </div>

        <div className="md:col-span-2">
          <PhoneInput
            countryCode={form.country_code}
            phone={form.phone}
            onCountryChange={(cc) => setForm({ ...form, country_code: cc })}
            onPhoneChange={(ph) => setForm({ ...form, phone: ph })}
          />
          {err('phone')}
        </div>

        {isLand && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('land_type')} *</label>
              <select value={form.land_type} onChange={(e) => setForm({ ...form, land_type: e.target.value })} className={inputCls} required>
                <option value="">{t('select_type')}</option>
                {LAND_TYPES.map((lt) => (
                  <option key={lt} value={lt}>{lt}</option>
                ))}
              </select>
              {err('land_type')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('land_size')}</label>
              <input type="text" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className={inputCls} placeholder={t('e_g_20_20')} />
              {err('area')}
            </div>
          </>
        )}

        {(isHouse || isVilla) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isVilla ? t('villa_type') : t('house_type')} *</label>
            <select value={form.house_type} onChange={(e) => setForm({ ...form, house_type: e.target.value })} className={inputCls} required>
              <option value="">{t('select_type')}</option>
              {(isVilla ? VILLA_TYPES : HOUSE_TYPES).map((ht) => (
                <option key={ht} value={ht}>{ht}</option>
              ))}
            </select>
            {err('house_type')}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status')} *</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls} required>
            <option value="available">{t('available')}</option>
            <option value="not_available">{t('not_available')}</option>
          </select>
          {err('status')}
        </div>

        {needsRooms && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bedrooms')} {roomsRequired ? '*' : ''}</label>
              <input type="number" min="0" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} className={inputCls} required={roomsRequired} />
              {err('bedrooms')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bathrooms')} {roomsRequired ? '*' : ''}</label>
              <input type="number" min="0" step="0.5" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} className={inputCls} required={roomsRequired} />
              {err('bathrooms')}
            </div>
          </>
        )}

        {isHouse && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('area')}</label>
            <input type="text" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className={inputCls} placeholder={t('e_g_20_20')} />
            {err('area')}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('price')} *</label>
          <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} required />
          {err('price')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('location')} {locationIsSelect ? '*' : ''}</label>
          {locationIsSelect ? (
            <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} required>
              <option value="">{t('select_neighborhood')}</option>
              {NEIGHBORHOODS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          ) : (
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} />
          )}
          {err('location')}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('image')}</label>
          {preview && <img src={preview} alt="current" className="mb-2 max-h-40 rounded-lg" />}
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
            onChange={(e) => {
              setImage(e.target.files[0]);
              setPreview(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null);
            }}
            className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-gray-600"
          />
          {err('image')}
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
