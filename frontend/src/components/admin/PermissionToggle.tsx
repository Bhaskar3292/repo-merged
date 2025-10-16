import React from 'react';

interface PermissionToggleProps {
  role: 'admin' | 'contributor' | 'viewer';
  permission: string;
  enabled: boolean;
  locked?: boolean;
  onChange: (enabled: boolean) => void;
}

export const PermissionToggle: React.FC<PermissionToggleProps> = ({
  role,
  permission,
  enabled,
  locked = false,
  onChange,
}) => {
  const roleColors = {
    admin: 'bg-purple-600',
    contributor: 'bg-blue-600',
    viewer: 'bg-gray-600',
  };

  const roleLabels = {
    admin: 'Administrator',
    contributor: 'Contributor',
    viewer: 'Viewer',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${roleColors[role]}`} />
        <span className="text-sm font-medium text-gray-700">
          {roleLabels[role]}
        </span>
      </div>

      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={enabled}
          disabled={locked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`
          w-11 h-6 rounded-full peer
          peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300
          ${locked ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-200'}
          peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full
          peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px]
          after:start-[2px] after:bg-white after:border-gray-300 after:border
          after:rounded-full after:h-5 after:w-5 after:transition-all
          ${enabled && !locked ? roleColors[role] : ''}
        `} />
        {locked && (
          <svg
            className="w-4 h-4 text-gray-500 absolute right-1 pointer-events-none"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </label>
    </div>
  );
};
