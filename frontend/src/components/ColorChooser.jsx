import { useState } from 'react';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import { COLOR_PRESETS } from '../pages/Settings';

export default function ColorChooser({ onClose }) {
  const { t, accentColor, setAccentColor, flashMessage } = useApp();
  const [picked, setPicked] = useState(accentColor);
  const [saving, setSaving] = useState(false);

  const choose = (hex) => {
    setPicked(hex);
    setAccentColor(hex);
  };

  const save = async () => {
    setSaving(true);
    localStorage.setItem('accentColor', picked);
    if (localStorage.getItem('token')) {
      try {
        await api.post('/settings/color', { accent_color: picked });
        flashMessage('success', 'Color saved successfully.');
      } catch {
        flashMessage('error', 'Failed to save color.');
      }
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Dooro Midabka</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose your preferred color.</p>
        <div className="flex flex-wrap gap-3 mb-4">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => choose(c.hex)}
              className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                picked.toLowerCase() === c.hex.toLowerCase()
                  ? 'border-gray-900 dark:border-white scale-110'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 mb-5">
          <label className="text-xs text-gray-500 dark:text-gray-400">Or pick a custom color:</label>
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(picked) ? picked : '#EAB308'}
            onChange={(e) => choose(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
          />
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase">{picked}</span>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => choose('#EAB308')}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              picked.toLowerCase() === '#eab308'
                ? 'accent-bg !text-gray-900 border-transparent'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Yellow (Default)
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Color'}
          </button>
        </div>
      </div>
    </div>
  );
}
