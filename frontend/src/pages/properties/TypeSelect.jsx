import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const TYPES = [
  {
    type: 'land',
    emoji: '🌍',
    titleKey: 'add_land',
    descKey: 'register_land_desc',
  },
  {
    type: 'house',
    emoji: '🏠',
    titleKey: 'add_house',
    descKey: 'register_house_desc',
  },
  {
    type: 'house-rental',
    emoji: '🔑',
    titleKey: 'add_rental_house',
    descKey: 'register_rental_desc',
  },
];

export default function PropertyTypeSelect() {
  const { t } = useApp();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('add_property')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('choose_property_type')}</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-6 max-w-3xl">
        {TYPES.map((item) => (
          <Link
            key={item.type}
            to={`/properties/create/${item.type}`}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center hover:border-yellow-400 hover:shadow-md transition-all"
          >
            <span className="block text-5xl mb-4 group-hover:scale-110 transition-transform">{item.emoji}</span>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t(item.titleKey)}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t(item.descKey)}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6">
        <Link to="/properties" className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
          ← {t('back_to_types')}
        </Link>
      </div>
    </div>
  );
}
