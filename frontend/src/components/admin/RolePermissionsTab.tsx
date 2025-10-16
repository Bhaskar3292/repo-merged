import React from 'react';
import { PermissionMatrix } from './PermissionMatrix';

export function RolePermissionsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-900">About Role Permissions</h3>
            <p className="text-sm text-blue-800 mt-1">
              Control which features each role can access. Administrator permissions are locked and cannot be changed.
              Toggle permissions for Contributor and Viewer roles to customize their access levels.
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white bg-opacity-50 rounded p-2">
                <strong className="text-purple-900">Administrator:</strong>
                <span className="text-blue-800"> Full access (locked)</span>
              </div>
              <div className="bg-white bg-opacity-50 rounded p-2">
                <strong className="text-blue-900">Contributor:</strong>
                <span className="text-blue-800"> Create & edit content</span>
              </div>
              <div className="bg-white bg-opacity-50 rounded p-2">
                <strong className="text-gray-900">Viewer:</strong>
                <span className="text-blue-800"> Read-only access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PermissionMatrix />
    </div>
  );
}
