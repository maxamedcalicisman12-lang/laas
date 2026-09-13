import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import api from '../../api/client';
import { Icon } from '../Icons';
function NavGroup({ label, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-sm px-3 py-2.5 rounded-lg text-white/90 hover:bg-white/10"
      >
        <span className="flex items-center">
          <span className="w-5 h-5 mr-3">{icon}</span>
          {label}
        </span>
        <span className={`transform ${open ? 'rotate-90' : ''}`}>{Icon.chevron}</span>
      </button>
      {open && <div className="ml-4 space-y-1">{children}</div>}
    </div>
  );
}

function SubLink({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `sidebar-link flex items-center text-sm px-3 py-2 rounded-lg text-white/90 ${isActive ? 'active' : ''}`
      }
    >
      {icon && <span className="w-5 h-5 mr-3 shrink-0">{icon}</span>}
      {children}
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { t, dark, toggleDark, locale, setLocale, flash, confirmState, closeConfirm } = useApp();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [now, setNow] = useState(new Date());
  const menuRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (localStorage.getItem('token')) {
        api
          .get('/notifications/unread-count')
          .then(({ data }) => {
            if (!cancelled) setUnreadCount(data.count);
          })
          .catch(() => {});
      }
    };
    load();
    const timer = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const changeLocale = async (loc) => {
    setLocale(loc);
    setLangMenuOpen(false);
    try {
      await api.post(`/settings/language/${loc}`);
    } catch {
      // ignore
    }
  };

  const clockFormat = locale === 'so' ? 'so-SO' : 'en-US';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans antialiased">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar-bg fixed inset-y-0 left-0 z-30 w-64 text-white transform transition-transform duration-200 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="px-4 py-5 border-b sidebar-border">
          <button onClick={() => setIntroOpen(true)} className="text-left w-full">
            <span className="text-xl font-bold tracking-wider">LAAS</span>{' '}
            <span className="text-orange-500">Real Estate</span>
          </button>
        </div>
        <nav className="px-3 py-4 space-y-1">
          <NavLink
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center text-sm px-3 py-2.5 rounded-lg text-white/90 hover:bg-white/10 ${
                isActive ? 'accent-bg !text-gray-900' : ''
              }`
            }
          >
            <span className="w-5 h-5 mr-3">{Icon.dashboard}</span>
            {t('dashboard')}
          </NavLink>

          <NavLink
            to="/listings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center text-sm px-3 py-2.5 rounded-lg text-white/90 hover:bg-white/10 ${
                isActive ? 'accent-bg !text-gray-900' : ''
              }`
            }
          >
            <span className="w-5 h-5 mr-3">{Icon.users}</span>
            {t('public_listings')}
          </NavLink>

          <NavGroup label={t('properties')} icon={Icon.home}>
            <SubLink to="/properties" icon={Icon.home}>{t('all_properties')}</SubLink>
            <SubLink to="/properties/create" icon={Icon.plus}>{t('add_property')}</SubLink>
          </NavGroup>

          <NavGroup label={t('tables')} icon={Icon.table} defaultOpen>
            <SubLink to="/land-sales" icon={Icon.map}>{t('land_sales')}</SubLink>
            <SubLink to="/house-rentals" icon={Icon.house}>{t('house_rentals')}</SubLink>
            <SubLink to="/house-sales" icon={Icon.building}>{t('house_sales')}</SubLink>
            <SubLink to="/used-items" icon={Icon.package}>{t('used_items')}</SubLink>
            <SubLink to="/payments" icon={Icon.creditCard}>{t('payments')}</SubLink>
            <SubLink to="/commissions" icon={Icon.dollarSign}>{t('commissions')}</SubLink>
            <SubLink to="/cleaners" icon={Icon.brush}>{t('cleaners')}</SubLink>
          </NavGroup>

          <NavGroup label={t('customers')} icon={Icon.users}>
            <SubLink to="/customers" icon={Icon.users}>{t('all_customers')}</SubLink>
            <SubLink to="/customers/create" icon={Icon.userPlus}>{t('add_customer')}</SubLink>
          </NavGroup>

          <div className="border-t sidebar-border my-2" />

          {user?.role === 'super_admin' && (
            <NavLink
              to="/users"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center text-sm px-3 py-2.5 rounded-lg text-white/90 hover:bg-white/10 ${
                  isActive ? 'accent-bg !text-gray-900' : ''
                }`
              }
            >
              <span className="w-5 h-5 mr-3">{Icon.user}</span>
              {t('users')}
            </NavLink>
          )}
          <NavLink
            to="/backups"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center text-sm px-3 py-2.5 rounded-lg text-white/90 hover:bg-white/10 ${
                isActive ? 'accent-bg !text-gray-900' : ''
              }`
            }
          >
            <span className="w-5 h-5 mr-3">{Icon.backup}</span>
            {t('backups')}
          </NavLink>
          <NavLink
            to="/activity-logs"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center text-sm px-3 py-2.5 rounded-lg text-white/90 hover:bg-white/10 ${
                isActive ? 'accent-bg !text-gray-900' : ''
              }`
            }
          >
            <span className="w-5 h-5 mr-3">{Icon.activity}</span>
            {t('activity_logs')}
          </NavLink>
          <NavLink
            to="/recycle-bin"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center text-sm px-3 py-2.5 rounded-lg text-white/90 hover:bg-white/10 ${
                isActive ? 'accent-bg !text-gray-900' : ''
              }`
            }
          >
            <span className="w-5 h-5 mr-3">{Icon.trash}</span>
            {t('recycle_bin')}
          </NavLink>

          <div className="border-t sidebar-border my-2" />

          <NavLink
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center text-sm px-3 py-2.5 rounded-lg text-white/90 hover:bg-white/10 ${
                isActive ? 'accent-bg !text-gray-900' : ''
              }`
            }
          >
            <span className="w-5 h-5 mr-3">{Icon.settings}</span>
            {t('settings')}
          </NavLink>
        </nav>
      </aside>

      {/* Main */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <button className="lg:hidden text-gray-500" onClick={() => setSidebarOpen(true)}>
                {Icon.menu}
              </button>
              <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300 tabular-nums">
                {now.toLocaleDateString(clockFormat, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {' · '}
                {now.toLocaleTimeString(clockFormat)}
              </span>
            </div>

            <div className="flex items-center space-x-2" ref={menuRef}>
              <button
                onClick={() => window.location.reload()}
                title={t('refresh')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {Icon.refresh}
              </button>

              <Link
                to="/notifications"
                className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {Icon.bell}
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              <button
                onClick={toggleDark}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {dark ? Icon.sun : Icon.moon}
              </button>

              <div className="relative">
                <button
                  onClick={() => {
                    setLangMenuOpen((o) => !o);
                    setUserMenuOpen(false);
                  }}
                  className="p-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 uppercase"
                >
                  {locale}
                </button>
                {langMenuOpen && (
                  <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <button
                      onClick={() => changeLocale('en')}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 ${
                        locale === 'en' ? 'font-semibold accent-text' : ''
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => changeLocale('so')}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 ${
                        locale === 'so' ? 'font-semibold accent-text' : ''
                      }`}
                    >
                      Soomaali
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setUserMenuOpen((o) => !o);
                    setLangMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <img
                    src={user?.profile_picture_url}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="hidden md:block text-left">
                    <span className="block text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
                      {user?.name}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 capitalize leading-tight">
                      {(user?.role || '').replace(/_/g, ' ')}
                    </span>
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {t('settings')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Flash */}
        {flash && (
          <div className="fixed top-16 right-4 z-50 max-w-sm">
            <div
              className={`p-4 rounded-lg text-sm border shadow-lg ${
                flash.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/50 dark:border-green-700 dark:text-green-200'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/50 dark:border-red-700 dark:text-red-200'
              }`}
            >
              {flash.message}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>

      {/* Intro modal */}
      {introOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIntroOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg p-6">
            <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              Ku soo dhawoow LAAS Real Estate
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Nidaamkan waxaa loo sameeyay maamulka guryaha, dhulka, iibka, kireynta, macmiisha,
              bixintaba, iyo diiwaanka hawlaha. Adigoo isticmaalaya menu-ga bidixda waad geli kartaa
              qayb kasta.
            </p>
            <button
              onClick={() => setIntroOpen(false)}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-lg"
            >
              {t('ok')}
            </button>
          </div>
        </div>
      )}

      {/* Global delete confirm modal */}
      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeConfirm} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('confirm_delete')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{confirmState.message}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeConfirm}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  const action = confirmState.action;
                  closeConfirm();
                  action();
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
