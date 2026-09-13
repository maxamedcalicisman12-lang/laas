import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import Pagination from '../../components/Pagination';
import SortableTh from '../../components/SortableTh';

const ROLE_COLORS = {
  super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  agent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  accountant: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

export default function UsersIndex() {
  const { t, confirm, flashMessage } = useApp();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState(params.get('search') || '');
  const query = Object.fromEntries(params.entries());

  const load = () => {
    api.get('/users', { params: query }).then(({ data }) => setData(data));
  };

  useEffect(load, [params]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === null || value === undefined) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  };

  const destroy = (id, name) => {
    confirm(`Delete user ${name}?`, async () => {
      try {
        await api.delete(`/users/${id}`);
        flashMessage('success', 'User deleted successfully.');
        load();
      } catch (err) {
        flashMessage('error', err.response?.data?.message || 'Failed to delete.');
      }
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('all_users')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('manage_users')}</p>
        </div>
        <Link to="/users/create" className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg">
          + {t('add_user')}
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setParam('search', search);
        }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 flex flex-wrap items-center gap-3"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search_users')}
          className="w-2/5 min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none"
        />
        <select value={query.role || ''} onChange={(e) => setParam('role', e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
          <option value="">{t('all_roles')}</option>
          <option value="super_admin">{t('super_admin')}</option>
          <option value="manager">{t('manager')}</option>
          <option value="agent">{t('agent')}</option>
          <option value="accountant">{t('accountant')}</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg">{t('search')}</button>
        {(query.search || query.role) && (
          <button type="button" onClick={() => { setSearch(''); setParams(new URLSearchParams()); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            {t('clear')}
          </button>
        )}
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              <tr>
                <SortableTh label={t('name')} field="name" />
                <SortableTh label={t('email')} field="email" />
                <SortableTh label={t('phone')} field="phone" />
                <SortableTh label={t('role')} field="role" />
                <SortableTh label={t('status')} field="is_active" />
                <th className="text-left px-4 py-3 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data?.data.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-800'}`}>
                      {t(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {u.is_active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    <Link to={`/users/${u.id}`} className="text-blue-600 hover:text-blue-800">{t('view')}</Link>
                    <Link to={`/users/${u.id}/edit`} className="text-yellow-600 hover:text-yellow-700">{t('edit')}</Link>
                    <button onClick={() => destroy(u.id, u.name)} className="text-red-600 hover:text-red-700">{t('delete')}</button>
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">{t('no_users_found')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination meta={data} onPage={(p) => setParam('page', p)} />
      </div>
    </div>
  );
}
