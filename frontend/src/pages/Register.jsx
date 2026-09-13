import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function Register() {
  const { login } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [minLength, setMinLength] = useState(8);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get('/register')
      .then(({ data }) => setMinLength(data.password_min_length || 8))
      .catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await api.post('/register', form);
      await login(form.email, form.password, false);
      navigate('/dashboard');
    } catch (err) {
      setErrors(err.response?.data?.errors || { name: ['Registration failed'] });
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
        required={required}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name][0]}</p>}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('create_account')}</h2>
      <form onSubmit={submit} className="space-y-4">
        {field('name', t('full_name'), 'text', true)}
        {field('email', t('email'), 'email', true)}
        {field('phone', t('phone'))}
        {field('password', `${t('password')} (${t('min')} ${minLength} ${t('characters')})`, 'password', true)}
        {field('password_confirmation', t('confirm_password'), 'password', true)}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? t('creating_account') : t('register')}
        </button>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {t('have_account')}{' '}
          <Link to="/login" className="text-yellow-600 hover:text-yellow-700 font-medium">
            {t('sign_in')}
          </Link>
        </p>
      </form>
    </div>
  );
}
