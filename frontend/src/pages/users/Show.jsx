import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';

const ROLE_COLORS = {
  super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  agent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  accountant: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{value || '—'}</p>
    </div>
  );
}

export default function UserShow() {
  const { id } = useParams();
  const { t } = useApp();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get(`/users/${id}`).then(({ data }) => setUser(data));
  }, [id]);

  if (!user) return <div className="text-sm text-gray-500">{t('loading')}</div>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
        <div className="space-x-3">
          <Link to={`/users/${id}/edit`} className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg">
            {t('edit')}
          </Link>
          <Link to="/users" className="inline-block px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            ← {t('back')}
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
        <div className="flex items-center space-x-4 mb-6">
          <img src={user.profile_picture_url} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ROLE_COLORS[user.role] || ''}`}>
              {t(user.role)}
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                user.is_active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}
            >
              {user.is_active ? t('active') : t('inactive')}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Detail label={t('email')} value={user.email} />
          <Detail label={t('phone')} value={user.phone} />
        </div>
      </div>
    </div>
  );
}
