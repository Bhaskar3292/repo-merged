import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Server, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';

interface Commander {
  id?: number;
  commander_type: string;
  serial_number: string;
  asm_subscription: string;
  base_software_version: string;
  tunnel_ip: string;
  user_id: string;
  password: string;
  issue_date: string;
  expiry_date: string;
}

interface CommanderInfoProps {
  selectedFacility?: {
    id: number;
    name: string;
  } | null;
}

const CommanderInfo = ({ selectedFacility }: CommanderInfoProps) => {
  const [commanders, setCommanders] = useState<Commander[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Commander>({
    commander_type: '',
    serial_number: '',
    asm_subscription: 'Own',
    base_software_version: '',
    tunnel_ip: '',
    user_id: '',
    password: '',
    issue_date: '',
    expiry_date: ''
  });

  useEffect(() => {
    if (selectedFacility) {
      loadCommanders();
    }
  }, [selectedFacility]);

  const loadCommanders = async () => {
    if (!selectedFacility) return;

    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCommandersByLocation(selectedFacility.id);
      setCommanders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error loading commanders:', err);
      setError(err.message || 'Failed to load commanders');
      setCommanders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      commander_type: '',
      serial_number: '',
      asm_subscription: 'Own',
      base_software_version: '',
      tunnel_ip: '',
      user_id: '',
      password: '',
      issue_date: '',
      expiry_date: ''
    });
  };

  const handleEdit = (commander: Commander) => {
    setEditingId(commander.id || null);
    setIsCreating(false);
    setFormData({
      commander_type: commander.commander_type || '',
      serial_number: commander.serial_number || '',
      asm_subscription: commander.asm_subscription || 'Own',
      base_software_version: commander.base_software_version || '',
      tunnel_ip: commander.tunnel_ip || '',
      user_id: commander.user_id || '',
      password: commander.password || '',
      issue_date: commander.issue_date || '',
      expiry_date: commander.expiry_date || ''
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      commander_type: '',
      serial_number: '',
      asm_subscription: 'Own',
      base_software_version: '',
      tunnel_ip: '',
      user_id: '',
      password: '',
      issue_date: '',
      expiry_date: ''
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isCreating) {
        await apiService.createCommander(selectedFacility.id, formData);
        setSuccess('Commander created successfully');
      } else if (editingId) {
        await apiService.updateCommander(editingId, formData);
        setSuccess('Commander updated successfully');
      }

      await loadCommanders();
      handleCancel();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save commander');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this commander?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiService.deleteCommander(id);
      setSuccess('Commander deleted successfully');
      await loadCommanders();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete commander');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof Commander, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // State A: No Facility Selected
  if (!selectedFacility) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <AlertCircle className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Facility Selected</h2>
          <p className="text-gray-600 text-lg">Please select a facility to view commander information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Server className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Commander Info</h2>
        </div>
        {!isCreating && !editingId && selectedFacility && (
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            <span>Add Commander</span>
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Save className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {(isCreating || editingId) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isCreating ? 'New Commander' : 'Edit Commander'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commander Type
              </label>
              <input
                type="text"
                value={formData.commander_type}
                onChange={(e) => updateField('commander_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number
              </label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => updateField('serial_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ASM Subscription
              </label>
              <select
                value={formData.asm_subscription}
                onChange={(e) => updateField('asm_subscription', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Own">Own</option>
                <option value="Brand Operated">Brand Operated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Software Version
              </label>
              <input
                type="text"
                value={formData.base_software_version}
                onChange={(e) => updateField('base_software_version', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tunnel IP
              </label>
              <input
                type="text"
                value={formData.tunnel_ip}
                onChange={(e) => updateField('tunnel_ip', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={formData.user_id}
                onChange={(e) => updateField('user_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                value={formData.issue_date}
                onChange={(e) => updateField('issue_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => updateField('expiry_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {!isCreating && !editingId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading && commanders.length === 0 ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading commanders...</p>
            </div>
          ) : commanders.length === 0 ? (
            <div className="p-12 text-center">
              <Server className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No commanders found</h3>
              <p className="text-gray-600 mb-6">Click "Add Commander" to create one</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commander Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ASM Subscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {commanders.map((commander) => (
                    <tr key={commander.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commander.commander_type || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commander.serial_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commander.asm_subscription || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commander.issue_date || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commander.expiry_date || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(commander)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => commander.id && handleDelete(commander.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommanderInfo;
