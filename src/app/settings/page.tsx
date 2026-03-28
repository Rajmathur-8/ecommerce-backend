'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Package, 
  Users, 
  Save,
  AlertCircle,
  CheckCircle,
  CreditCard,
  X,
  Plus
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import toast from 'react-hot-toast';

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  orderNotifications: boolean;
  stockAlertNotifications: boolean;
  customerNotifications: boolean;
}

interface StockAlertSettings {
  lowStockThreshold: number;
  criticalStockThreshold: number;
  enableAutoAlerts: boolean;
  alertEmails: string[];
  checkInterval: string;
}

interface ActiveUserSettings {
  activeDays: number;
  weeklyActiveDays: number;
  monthlyActiveDays: number;
}

interface GeneralSettings {
  siteName: string;
  siteUrl: string;
  currency: string;
  timezone: string;
  language: string;
}

interface OrderSettings {
  autoConfirmOrders: boolean;
  orderPrefix: string;
  minOrderAmount: number;
  maxOrderAmount: number;
}

interface NotificationSettings {
  enablePushNotifications: boolean;
  enableSmsNotifications: boolean;
  smsProvider: string;
}

interface CodSettings {
  enabledPincodes: string[];
  enableForAll: boolean;
}

interface Settings {
  emailSettings: EmailSettings;
  stockAlertSettings: StockAlertSettings;
  activeUserSettings: ActiveUserSettings;
  generalSettings: GeneralSettings;
  orderSettings: OrderSettings;
  notificationSettings: NotificationSettings;
  codSettings: CodSettings;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('stock');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const tabs = [
    { id: 'stock', name: 'Stock Alerts', icon: Package },
    { id: 'activeUser', name: 'Active Users', icon: Users },
    { id: 'cod', name: 'COD Settings', icon: CreditCard },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/admin/settings'), {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.data);
        } else {
          toast.error(data.message || 'Failed to load settings');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to load settings');
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(getApiUrl('/admin/settings'), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Settings saved successfully!');
          fetchSettings(); // Refresh settings
        } else {
          toast.error(data.message || 'Failed to save settings');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };


  const updateSetting = (category: keyof Settings, field: string, value: any) => {
    if (!settings) return;
    
    // Initialize codSettings if it doesn't exist
    if (category === 'codSettings' && !settings.codSettings) {
      settings.codSettings = {
        enabledPincodes: [],
        enableForAll: false
      };
    }
    
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [field]: value
      }
    });
  };

  if (loading || !settings) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Configure stock alerts and active user settings</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Stock Alert Settings */}
            {activeTab === 'stock' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Stock Alert Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      value={settings.stockAlertSettings.lowStockThreshold}
                      onChange={(e) => updateSetting('stockAlertSettings', 'lowStockThreshold', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this number</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Critical Stock Threshold
                    </label>
                    <input
                      type="number"
                      value={settings.stockAlertSettings.criticalStockThreshold}
                      onChange={(e) => updateSetting('stockAlertSettings', 'criticalStockThreshold', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Critical alert threshold</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check Interval
                    </label>
                    <select
                      value={settings.stockAlertSettings.checkInterval}
                      onChange={(e) => updateSetting('stockAlertSettings', 'checkInterval', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="realtime">Real-time</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.stockAlertSettings.enableAutoAlerts}
                      onChange={(e) => updateSetting('stockAlertSettings', 'enableAutoAlerts', e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Enable Automatic Stock Alerts</span>
                  </label>
                </div>
              </div>
            )}

            {/* Active User Settings */}
            {activeTab === 'activeUser' && (
              <div className="space-y-6">
               
                <h2 className="text-xl font-semibold text-gray-900">Active User Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border-2 border-primary-200 rounded-lg p-6 bg-primary-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-5 h-5 inline mr-2" />
                      Active Days (Primary)
                    </label>
                    <input
                      type="number"
                      value={settings.activeUserSettings.activeDays}
                      onChange={(e) => updateSetting('activeUserSettings', 'activeDays', parseInt(e.target.value))}
                      className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="1"
                      max="90"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      Main metric for active users (recommended: 15 days)
                    </p>
                  </div>

                  <div className="border rounded-lg p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weekly Active Days
                    </label>
                    <input
                      type="number"
                      value={settings.activeUserSettings.weeklyActiveDays}
                      onChange={(e) => updateSetting('activeUserSettings', 'weeklyActiveDays', parseInt(e.target.value))}
                      className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="1"
                      max="30"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      For weekly active users metric
                    </p>
                  </div>

                  <div className="border rounded-lg p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Active Days
                    </label>
                    <input
                      type="number"
                      value={settings.activeUserSettings.monthlyActiveDays}
                      onChange={(e) => updateSetting('activeUserSettings', 'monthlyActiveDays', parseInt(e.target.value))}
                      className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="1"
                      max="90"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      For monthly active users metric
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* COD Settings */}
            {activeTab === 'cod' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Cash on Delivery (COD) Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={settings.codSettings?.enableForAll || false}
                      onChange={(e) => {
                        updateSetting('codSettings', 'enableForAll', e.target.checked);
                        if (e.target.checked) {
                          updateSetting('codSettings', 'enabledPincodes', []);
                        }
                      }}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div>
                      <label className="text-sm font-medium text-gray-900 cursor-pointer">
                        Enable COD for All Pincodes
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        If enabled, COD will be available for all pincodes regardless of the list below
                      </p>
                    </div>
                  </div>

                  {!settings.codSettings?.enableForAll && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          COD Enabled Pincodes
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                          Add pincodes where Cash on Delivery is available. One pincode per line or comma-separated.
                        </p>
                        
                        {/* Add Pincode Input */}
                        <div className="flex space-x-2 mb-4">
                          <input
                            type="text"
                            id="newPincode"
                            placeholder="Enter pincode (e.g., 110001 or 110001,110002)"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.currentTarget;
                                const value = input.value.trim();
                                if (value) {
                                  const pincodes = value.split(',').map(p => p.trim()).filter(p => p && /^\d{6}$/.test(p));
                                  if (pincodes.length > 0) {
                                    const currentPincodes = settings.codSettings?.enabledPincodes || [];
                                    const newPincodes = Array.from(new Set([...currentPincodes, ...pincodes]));
                                    updateSetting('codSettings', 'enabledPincodes', newPincodes);
                                    input.value = '';
                                    toast.success(`${pincodes.length} pincode(s) added`);
                                  } else {
                                    toast.error('Please enter valid 6-digit pincodes');
                                  }
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('newPincode') as HTMLInputElement;
                              const value = input?.value.trim();
                              if (value) {
                                const pincodes = value.split(',').map(p => p.trim()).filter(p => p && /^\d{6}$/.test(p));
                                if (pincodes.length > 0) {
                                  const currentPincodes = settings.codSettings?.enabledPincodes || [];
                                  const newPincodes = Array.from(new Set([...currentPincodes, ...pincodes]));
                                  updateSetting('codSettings', 'enabledPincodes', newPincodes);
                                  input.value = '';
                                  toast.success(`${pincodes.length} pincode(s) added`);
                                } else {
                                  toast.error('Please enter valid 6-digit pincodes');
                                }
                              }
                            }}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add</span>
                          </button>
                        </div>

                        {/* Pincode List */}
                        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                          {settings.codSettings?.enabledPincodes && settings.codSettings.enabledPincodes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {settings.codSettings.enabledPincodes.map((pincode, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center space-x-2 px-3 py-1 bg-white border border-gray-300 rounded-full text-sm"
                                >
                                  <span>{pincode}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentPincodes = settings.codSettings?.enabledPincodes || [];
                                      const newPincodes = currentPincodes.filter((_, i) => i !== index);
                                      updateSetting('codSettings', 'enabledPincodes', newPincodes);
                                      toast.success('Pincode removed');
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                              No pincodes added. Add pincodes above to enable COD for specific areas.
                            </p>
                          )}
                        </div>

                        {settings.codSettings?.enabledPincodes && settings.codSettings.enabledPincodes.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            Total: {settings.codSettings.enabledPincodes.length} pincode(s)
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {settings.codSettings?.enableForAll && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        COD is currently enabled for all pincodes. Uncheck the option above to manage specific pincodes.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

