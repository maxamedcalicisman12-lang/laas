import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await login(form.email, form.password, form.remember);
      navigate('/dashboard');
    } catch (err) {
      setErrors(err.response?.data?.errors || { email: [err.response?.data?.message || 'Login failed'] });
      if (err.response?.data?.email_input) {
        setForm((f) => ({ ...f, email: err.response.data.email_input }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('sign_in')}</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('username_or_email')}</label>
          <input
            type="text"
            autoComplete="username"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
            required
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email[0]}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('password')}</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
            required
          />
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password[0]}</p>}
        </div>
        <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={form.remember}
            onChange={(e) => setForm({ ...form, remember: e.target.checked })}
            className="rounded border-gray-300 text-yellow-400 focus:ring-yellow-400"
          />
          <span>{t('remember_me')}</span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? t('signing_in') : t('sign_in')}
        </button>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {t('no_account')}{' '}
          <Link to="/register" className="text-yellow-600 hover:text-yellow-700 font-medium">
            {t('register')}
          </Link>
        </p>
      </form>
    </div>
  );
}
