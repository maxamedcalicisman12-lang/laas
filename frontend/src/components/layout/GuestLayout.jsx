import { Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function GuestLayout() {
  const { t } = useApp();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 font-sans antialiased px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white">
            LAAS <span className="text-orange-500">Real Estate</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('management_system')}</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
