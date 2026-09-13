import { useEffect, useState } from 'react';
import api from '../api/client';
import { useApp } from '../context/AppContext';

export default function Backups() {
  const { t, confirm, flashMessage } = useApp();
  const [backups, setBackups] = useState(null);
  const [creating, setCreating] = useState(false);
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const toggleSort = (field) => {
    if (sortKey === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(field);
      setSortDir('asc');
    }
  };

  const sortedBackups = [...(backups || [])].sort((a, b) => {
    const cmp =
      sortKey === 'size'
        ? Number(a.size) - Number(b.size)
        : String(a[sortKey]).localeCompare(String(b[sortKey]));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const load = () => {
    api.get('/backups').then(({ data }) => setBackups(data.backups));
  };

  useEffect(load, []);

  const createBackup = async () => {
    setCreating(true);
    try {
      await api.post('/backups');
      flashMessage('success', t('backup_created'));
      load();
    } catch (err) {
      flashMessage('error', err.response?.data?.message || t('failed_create_backup'));
    } finally {
      setCreating(false);
    }
  };

  const download = async (name) => {
    try {
      const res = await api.get(`/backups/${encodeURIComponent(name)}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      flashMessage('error', err.response?.data?.message || t('failed_download_backup'));
    }
  };

  const destroy = (name) => {
    confirm(`${t('delete_backup_confirm')} ${name}?`, async () => {
      try {
        await api.delete(`/backups/${encodeURIComponent(name)}`);
        flashMessage('success', t('backup_deleted'));
        load();
      } catch (err) {
        flashMessage('error', err.response?.data?.message || t('failed_delete'));
      }
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('database_backups')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('manage_backups')}</p>
        </div>
        <button onClick={createBackup} disabled={creating} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
          {creating ? t('creating') : t('create_backup')}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              <tr>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none whitespace-nowrap hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors" onClick={() => toggleSort('name')}>
                  <span className="inline-flex items-center gap-1">{t('file_name')}<span className={`text-[10px] leading-none ${sortKey === 'name' ? '' : 'opacity-30'}`}>{sortKey === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span></span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none whitespace-nowrap hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors" onClick={() => toggleSort('size')}>
                  <span className="inline-flex items-center gap-1">{t('size')}<span className={`text-[10px] leading-none ${sortKey === 'size' ? '' : 'opacity-30'}`}>{sortKey === 'size' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span></span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none whitespace-nowrap hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors" onClick={() => toggleSort('date')}>
                  <span className="inline-flex items-center gap-1">{t('created_at')}<span className={`text-[10px] leading-none ${sortKey === 'date' ? '' : 'opacity-30'}`}>{sortKey === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span></span>
                </th>
                <th className="text-left px-4 py-3 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sortedBackups.map((b) => (
                <tr key={b.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{b.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{(b.size / 1024).toFixed(1)} KB</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{b.date}</td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    <button onClick={() => download(b.name)} className="text-blue-600 hover:text-blue-800">{t('download')}</button>
                    <button onClick={() => destroy(b.name)} className="text-red-600 hover:text-red-700">{t('delete')}</button>
                  </td>
                </tr>
              ))}
              {backups?.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">{t('no_backups')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
