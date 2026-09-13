import { useApp } from '../context/AppContext';

const STATUS_COLORS = {
  available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  not_available: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  rented: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  sold: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  inactive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  new: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  good: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  fair: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  poor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function StatusPill({ status, labels = {} }) {
  const { t } = useApp();
  const cls = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  const fallback = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const label = labels[status] || (t(status) !== status ? t(status) : fallback);
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}
