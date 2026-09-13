import { useEffect, useRef, useState } from 'react';
import { COUNTRIES } from './countries';

export default function PhoneInput({ countryCode = '+252', phone = '', onCountryChange, onPhoneChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = COUNTRIES.find((c) => `+${c.dial}` === countryCode) || COUNTRIES.find((c) => c.code === 'SO');
  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.dial.includes(query.replace('+', ''))
  );

  return (
    <div className="relative flex" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center min-w-[90px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg text-sm bg-gray-50 dark:bg-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-500"
      >
        <span className="mr-1">{selected?.flag}</span>
        <span>+{selected?.dial}</span>
        <svg className="w-3 h-3 ml-auto ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 max-h-80 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="p-2 sticky top-0 bg-white dark:bg-gray-800">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none"
            />
          </div>
          {filtered.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                onCountryChange(`+${c.dial}`);
                setOpen(false);
                setQuery('');
              }}
              className={`flex items-center w-full px-3 py-2 text-sm hover:bg-yellow-50 dark:hover:bg-gray-700 ${
                selected?.code === c.code ? 'bg-yellow-50 dark:bg-gray-700' : ''
              }`}
            >
              <span className="mr-2">{c.flag}</span>
              <span className="text-gray-800 dark:text-gray-200">{c.name}</span>
              <span className="ml-auto text-gray-400">+{c.dial}</span>
            </button>
          ))}
        </div>
      )}

      <input
        type="tel"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        className="flex-1 min-w-0 px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none"
      />
    </div>
  );
}
