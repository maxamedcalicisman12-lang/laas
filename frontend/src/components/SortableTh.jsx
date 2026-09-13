import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function SortableTh({ label, field }) {
  const { t } = useApp();
  const [params, setParams] = useSearchParams();
  const active = params.get('sort') === field;
  const dir = params.get('direction') === 'asc' ? 'asc' : 'desc';

  const handleClick = () => {
    const next = new URLSearchParams(params);
    if (active) {
      next.set('direction', dir === 'asc' ? 'desc' : 'asc');
    } else {
      next.set('sort', field);
      next.set('direction', 'asc');
    }
    next.delete('page');
    setParams(next);
  };

  return (
    <th
      onClick={handleClick}
      className="text-left px-4 py-3 font-medium cursor-pointer select-none whitespace-nowrap hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors"
      title={t('sort')}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={`text-[10px] leading-none ${active ? '' : 'opacity-30'}`}>
          {active ? (dir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </span>
    </th>
  );
}
