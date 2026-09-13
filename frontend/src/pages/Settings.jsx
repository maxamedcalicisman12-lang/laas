import { useEffect, useState } from 'react';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const COLOR_PRESETS = [
  { name: 'yellow', hex: '#EAB308' },
  { name: 'blue', hex: '#3B82F6' },
  { name: 'green', hex: '#22C55E' },
  { name: 'red', hex: '#EF4444' },
  { name: 'purple', hex: '#A855F7' },
  { name: 'pink', hex: '#EC4899' },
  { name: 'orange', hex: '#F97316' },
  { name: 'teal', hex: '#14B8A6' },
  { name: 'indigo', hex: '#6366F1' },
];
const COLOR_MAP = Object.fromEntries(COLOR_PRESETS.map(({ name, hex }) => [name, hex]));

const CLEAR_TABLES = [
  { value: 'cleaners', label: 'Cleaners' },
  { value: 'customers', label: 'Customers' },
  { value: 'properties', label: 'Properties' },
  { value: 'land_sales', label: 'Land Sales' },
  { value: 'house_sales', label: 'House Sales' },
  { value: 'house_rentals', label: 'House Rentals' },
  { value: 'used_items', label: 'Used Items' },
  { value: 'payments', label: 'Payments' },
  { value: 'activity_logs', label: 'Activity Logs' },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
        checked ? 'bg-yellow-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function SectionTitle({ children, danger = false }) {
  return (
    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
      <span className={`w-1 h-5 rounded-full ${danger ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
      {children}
    </h2>
  );
}

function OptionButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-gray-900 text-white dark:bg-yellow-500 dark:text-gray-900'
          : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

export default function Settings() {
  const { t, flashMessage, dark, toggleDark, locale, setLocale, setAccentColor, setHasAccent } = useApp();
  const { updateUser } = useAuth();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', username: '', email: '', phone: '' });
  const [picture, setPicture] = useState(null);
  const [color, setColor] = useState('yellow');

  const [security, setSecurity] = useState({
    password_min_length: 8,
    password_require_uppercase: false,
    password_require_numeric: false,
    password_require_special: false,
    login_max_attempts: 5,
    login_lockout_minutes: 15,
  });
  const [commissionRate, setCommissionRate] = useState('10');
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [clearTable, setClearTable] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savingSection, setSavingSection] = useState('');

  const refreshUser = () => {
    api.get('/auth/me').then(({ data }) => updateUser(data.user)).catch(() => {});
  };

  useEffect(() => {
    let cancelled = false;
    api
      .get('/settings')
      .then(({ data }) => {
        if (cancelled) return;
        setUser(data.user);
        setProfile({
          name: data.user.name || '',
          username: data.user.username || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
        });
        setSecurity({
          password_min_length: parseInt(data.settings.password_min_length || 8),
          password_require_uppercase: data.settings.password_require_uppercase === '1',
          password_require_numeric: data.settings.password_require_numeric === '1',
          password_require_special: data.settings.password_require_special === '1',
          login_max_attempts: parseInt(data.settings.login_max_attempts || 5),
          login_lockout_minutes: parseInt(data.settings.login_lockout_minutes || 15),
        });
        const savedColor = data.settings.accent_color || 'yellow';
        setColor(savedColor);
        setAccentColor(COLOR_MAP[savedColor] || savedColor);
        setCommissionRate(parseFloat(data.settings.commission_rate || 10));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const run = async (section, fn) => {
    setSavingSection(section);
    try {
      await fn();
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstError = errors && Object.values(errors)[0]?.[0];
      flashMessage('error', firstError || err.response?.data?.message || 'Failed to save.');
    } finally {
      setSavingSection('');
    }
  };

  const switchLocale = (loc) => {
    setLocale(loc);
    api.post(`/settings/language/${loc}`).catch(() => {});
  };

  const previewColor = (value) => {
    setColor(value);
    setAccentColor(COLOR_MAP[value] || value);
  };

  const saveProfile = () =>
    run('profile', async () => {
      await api.post('/settings/profile', profile);
      if (picture) {
        const fd = new FormData();
        fd.append('profile_picture', picture);
        await api.post('/settings/profile-picture', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      flashMessage('success', 'Profile updated successfully.');
      setPicture(null);
      refreshUser();
    });

  const removePicture = () =>
    run('picture', async () => {
      await api.post('/settings/profile-picture/remove');
      flashMessage('success', 'Profile picture removed successfully.');
      refreshUser();
    });

  const toggleTwoFactor = () =>
    run('twofactor', async () => {
      const { data } = await api.post('/settings/two-factor/toggle');
      setUser((u) => ({ ...u, two_factor_enabled: data.two_factor_enabled }));
      refreshUser();
      flashMessage('success', data.message);
    });

  const saveSecurity = () =>
    run('security', async () => {
      await api.post('/settings/security', security);
      flashMessage('success', 'Security settings updated successfully.');
    });

  const changePassword = () =>
    run('password', async () => {
      await api.post('/settings/password', passwords);
      flashMessage('success', 'Password changed successfully.');
      setPasswords({ current_password: '', new_password: '', new_password_confirmation: '' });
    });

  const saveColor = () =>
    run('color', async () => {
      await api.post('/settings/color', { accent_color: color });
      localStorage.setItem('accentColor', COLOR_MAP[color] || color);
      setHasAccent(true);
      flashMessage('success', 'Color scheme updated successfully.');
    });

  const saveCommission = () =>
    run('commission', async () => {
      await api.post('/settings/commission', { commission_rate: commissionRate });
      flashMessage('success', 'Commission rate updated successfully.');
    });


  const clearData = () =>
    run('clear', async () => {
      await api.post('/settings/clear-data', { table: clearTable });
      flashMessage('success', `All data in '${clearTable}' has been cleared successfully.`);
      setClearTable('');
      setConfirmOpen(false);
    });

  const inputCls =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none';
  const btnCls =
    'px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const smallBtnCls =
    'w-full px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50';
  const cardCls = 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6';
  const resolvedColor = COLOR_MAP[color] || color;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('settings')}</p>
      </div>

      <div className="space-y-8 max-w-3xl">
        {/* ============================ PROFILE ============================ */}
        <div>
          <SectionTitle>Profile</SectionTitle>
          <div className={cardCls}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('update_profile')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('update_profile_desc')}</p>
            <form onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('name')}</label>
                  <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email')}</label>
                  <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('phone')}</label>
                  <input type="text" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('username')}</label>
                  <input type="text" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div className="flex items-center space-x-4 my-4">
                <img src={user?.profile_picture_url} alt={user?.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
                <div className="space-y-2">
                  <label className="inline-flex items-center px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    {picture ? picture.name : t('choose_image')}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                      onChange={(e) => setPicture(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                  {user?.profile_picture && (
                    <button
                      type="button"
                      onClick={removePicture}
                      disabled={savingSection === 'picture'}
                      className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 block"
                    >
                      {t('remove_picture')}
                    </button>
                  )}
                </div>
              </div>

              <button type="submit" disabled={savingSection === 'profile'} className={btnCls}>
                {savingSection === 'profile' ? 'Saving...' : t('save_profile')}
              </button>
            </form>
          </div>
        </div>

        {/* ============================ APPEARANCE ============================ */}
        <div>
          <SectionTitle>Appearance</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`${cardCls} flex items-center justify-between`}>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('dark_mode')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('dark_mode_description')}</p>
              </div>
              <Toggle checked={dark} onChange={toggleDark} />
            </div>

            <div className={cardCls}>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('language')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('language_description')}</p>
              </div>
              <div className="mt-4 flex gap-3">
                <OptionButton active={locale === 'en'} onClick={() => switchLocale('en')}>
                  {t('english')}
                </OptionButton>
                <OptionButton active={locale === 'so'} onClick={() => switchLocale('so')}>
                  {t('somali')}
                </OptionButton>
              </div>
            </div>
          </div>

          <div className={`mt-4 ${cardCls}`}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Color Scheme</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Choose your preferred accent color</p>
            <div className="flex flex-wrap gap-3 mb-4">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => previewColor(c.name)}
                  className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                    resolvedColor === c.hex ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="text-xs text-gray-500 dark:text-gray-400">Or pick a custom color:</label>
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(resolvedColor) ? resolvedColor : '#EAB308'}
                onChange={(e) => previewColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
              />
            </div>
            <button onClick={saveColor} disabled={savingSection === 'color'} className={btnCls}>
              {savingSection === 'color' ? 'Saving...' : 'Save Color'}
            </button>
          </div>
        </div>


        {/* ============================ COMMISSION ============================ */}
        <div>
          <SectionTitle>Commission</SectionTitle>
          <div className={cardCls}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('commission_rate')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Percentage of the sale/rental amount deducted automatically as commission.
            </p>
            <div className="flex items-center gap-3 max-w-xs">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className={inputCls}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">%</span>
              <button onClick={saveCommission} disabled={savingSection === 'commission'} className={btnCls}>
                {savingSection === 'commission' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* ============================ SECURITY ============================ */}
        <div>
          <SectionTitle>Security</SectionTitle>
          <div className="space-y-4">
            <div className={cardCls}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('two_factor')}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('two_factor_desc')}</p>
                </div>
                <Toggle checked={!!user?.two_factor_enabled} onChange={toggleTwoFactor} />
              </div>
              {user?.two_factor_enabled && (
                <p className="mt-3 text-xs text-green-600 dark:text-green-400">{t('two_factor_active')}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={cardCls}>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('change_password')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('change_password_desc')}</p>
                <form onSubmit={(e) => { e.preventDefault(); changePassword(); }} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('current_password')}</label>
                    <input type="password" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('new_password')}</label>
                    <input type="password" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('confirm_new_password')}</label>
                    <input type="password" value={passwords.new_password_confirmation} onChange={(e) => setPasswords({ ...passwords, new_password_confirmation: e.target.value })} className={inputCls} />
                  </div>
                  <button type="submit" disabled={savingSection === 'password'} className={smallBtnCls}>
                    {savingSection === 'password' ? 'Saving...' : t('change_password_btn')}
                  </button>
                </form>
              </div>

              <div className={cardCls}>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('password_policy')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('password_policy_desc')}</p>
                <form onSubmit={(e) => { e.preventDefault(); saveSecurity(); }} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('min_length')}</label>
                    <input type="number" min="6" max="128" value={security.password_min_length} onChange={(e) => setSecurity({ ...security, password_min_length: e.target.value })} className={inputCls} />
                  </div>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={security.password_require_uppercase} onChange={(e) => setSecurity({ ...security, password_require_uppercase: e.target.checked })} className="rounded border-gray-300 text-yellow-400 focus:ring-yellow-400" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{t('require_uppercase')}</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={security.password_require_numeric} onChange={(e) => setSecurity({ ...security, password_require_numeric: e.target.checked })} className="rounded border-gray-300 text-yellow-400 focus:ring-yellow-400" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{t('require_number')}</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={security.password_require_special} onChange={(e) => setSecurity({ ...security, password_require_special: e.target.checked })} className="rounded border-gray-300 text-yellow-400 focus:ring-yellow-400" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{t('require_special')}</span>
                  </label>
                  <button type="submit" disabled={savingSection === 'security'} className={smallBtnCls}>
                    {savingSection === 'security' ? 'Saving...' : t('save_password_policy')}
                  </button>
                </form>
              </div>

              <div className={cardCls}>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('login_attempt_limit')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('login_attempt_limit_desc')}</p>
                <form onSubmit={(e) => { e.preventDefault(); saveSecurity(); }} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('max_attempts')}</label>
                    <input type="number" min="1" max="100" value={security.login_max_attempts} onChange={(e) => setSecurity({ ...security, login_max_attempts: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('lockout_minutes')}</label>
                    <input type="number" min="1" max="1440" value={security.login_lockout_minutes} onChange={(e) => setSecurity({ ...security, login_lockout_minutes: e.target.value })} className={inputCls} />
                  </div>
                  <button type="submit" disabled={savingSection === 'security'} className={`${smallBtnCls} mt-4`}>
                    {savingSection === 'security' ? 'Saving...' : t('save_login_attempts')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* ============================ DANGER ZONE ============================ */}
        <div>
          <SectionTitle danger>Danger Zone</SectionTitle>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Clear Table Data</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Permanently delete all records from a selected table. This action cannot be undone.</p>
              </div>
              <select
                value={clearTable}
                onChange={(e) => setClearTable(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none"
              >
                <option value="">-- Select a table --</option>
                {CLEAR_TABLES.map((tb) => (
                  <option key={tb.value} value={tb.value}>{tb.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => clearTable && setConfirmOpen(true)}
                disabled={!clearTable}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => setConfirmOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Confirm Clear Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Are you sure you want to delete <strong>all</strong> records from{' '}
              <strong className="text-red-600">
                {(CLEAR_TABLES.find((tb) => tb.value === clearTable)?.label || clearTable)
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </strong>
              ?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-6">This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={savingSection === 'clear'}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={clearData}
                disabled={savingSection === 'clear'}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {savingSection === 'clear' ? 'Clearing...' : 'Yes, Clear All Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
