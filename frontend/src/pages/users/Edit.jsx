import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';
import { UserForm } from './Create';

export default function UserEdit() {
  const { id } = useParams();
  const { t, flashMessage } = useApp();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/users/${id}/edit-meta`).then(({ data }) => setUser(data.record));
  }, [id]);

  if (!user) return <div className="text-sm text-gray-500">{t('loading')}</div>;

  const submit = async (form) => {
    setSaving(true);
    setErrors({});
    try {
      await api.put(`/users/${id}`, form);
      flashMessage('success', 'User updated successfully.');
      navigate(`/users/${id}`);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      flashMessage('error', err.response?.data?.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('edit_user')}</h1>
      </div>
      <UserForm initial={user} onSubmit={submit} errors={errors} saving={saving} cancelTo={`/users/${id}`} submitLabel={t('update_user')} />
    </div>
  );
}
