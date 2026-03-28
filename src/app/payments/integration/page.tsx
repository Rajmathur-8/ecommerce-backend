'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useState, useEffect } from 'react';
import { CreditCard, Shield, Settings, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import ConfirmDialog from '@/components/ConfirmDialog';

const paymentMethods = [
  {
    id: 'razorpay',
    name: 'Razorpay',
    description: 'Popular payment gateway for Indian businesses',
    logo: 'https://razorpay.com/favicon.png',
    isActive: true,
    isConfigured: true,
    features: ['UPI', 'Cards', 'Net Banking', 'Wallets'],
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    description: 'Pay when you receive your order',
    logo: 'https://example.com/cod-icon.png',
    isActive: true,
    isConfigured: true,
    features: ['Cash Payment'],
  },
];

export default function PaymentIntegrationPage() {
  const [activeTab, setActiveTab] = useState('methods');
  const [razorpayConfig, setRazorpayConfig] = useState({
    keyId: '',
    keySecret: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Webhook configuration state
  const [webhookConfig, setWebhookConfig] = useState({
    webhookUrl: 'https://yourdomain.com/api/webhooks/payment',
    events: ['payment.captured', 'payment.failed', 'refund.processed', 'order.paid']
  });
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookData, setWebhookData] = useState<{
    url: string;
    status: 'enabled' | 'disabled';
    events: string[];
    lastUpdated: string;
  } | null>(null);

  const [razorpayData, setRazorpayData] = useState<{
    keyId: string;
    status: 'enabled' | 'disabled';
    lastUpdated: string;
  } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'webhook' | 'razorpay' | null;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: null,
    title: '',
    message: ''
  });

  // Load existing Razorpay configuration
  const loadRazorpayConfig = async () => {
    try {
      const response = await fetch(getApiUrl('/admin/payment-methods'), {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        const razorpayMethod = data.paymentMethods?.find((method: any) => method.name === 'Razorpay');
        
        if (razorpayMethod?.config) {
          setRazorpayConfig({
            keyId: razorpayMethod.config.razorpayKeyId || '',
            keySecret: razorpayMethod.config.razorpayKeySecret ? '••••••••••••••••••••••••••••••••' : '',
          });
          
          // Set Razorpay table data if credentials exist
          if (razorpayMethod.config.razorpayKeyId) {
            setRazorpayData({
              keyId: razorpayMethod.config.razorpayKeyId,
              status: 'enabled',
              lastUpdated: razorpayMethod.updatedAt ? new Date(razorpayMethod.updatedAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              }) : new Date().toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })
            });
          }
          
          // Load webhook configuration if exists
          if (razorpayMethod.config.webhookUrl) {
            setWebhookConfig({
              webhookUrl: razorpayMethod.config.webhookUrl,
              events: razorpayMethod.config.webhookEvents || ['payment.captured', 'payment.failed', 'refund.processed', 'order.paid']
            });
            
            // Set webhook table data
            setWebhookData({
              url: razorpayMethod.config.webhookUrl,
              status: 'enabled',
              events: razorpayMethod.config.webhookEvents || ['payment.captured', 'payment.failed', 'refund.processed', 'order.paid'],
              lastUpdated: razorpayMethod.updatedAt ? new Date(razorpayMethod.updatedAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              }) : new Date().toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })
            });
          }
        }
      }
    } catch (error) {
    }
  };

  // Load configuration on component mount
  useEffect(() => {
    loadRazorpayConfig();
  }, []);

  // Handle webhook configuration save
  const handleSaveWebhookConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookConfig.webhookUrl) {
      toast.error('Please enter a valid webhook URL');
      return;
    }
    
    setWebhookLoading(true);
    
    try {
      const response = await fetch(getApiUrl('/admin/payments/config/webhook'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(webhookConfig),
      });

      if (response.ok) {
        toast.success('Webhook configuration saved successfully');
        // Update webhook table data
        setWebhookData({
          url: webhookConfig.webhookUrl,
          status: 'enabled',
          events: webhookConfig.events,
          lastUpdated: new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          })
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save webhook configuration');
      }
    } catch (error) {
      toast.error('Failed to save webhook configuration');
    } finally {
      setWebhookLoading(false);
    }
  };

  // Handle webhook event toggle
  const handleEventToggle = (event: string) => {
    setWebhookConfig(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  // Handle webhook configuration delete
  const handleDeleteWebhookClick = () => {
    if (!webhookData) {
      toast.error('No webhook configuration to delete');
      return;
    }

    setDeleteDialog({
      isOpen: true,
      type: 'webhook',
      title: 'Delete Webhook Configuration',
      message: 'Are you sure you want to delete the webhook configuration?'
    });
  };

  const handleDeleteWebhook = async () => {

    setWebhookLoading(true);
    
    try {
      const response = await fetch(getApiUrl('/admin/payments/config/webhook'), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        toast.success('Webhook configuration deleted successfully');
        setWebhookData(null);
        setWebhookConfig({
          webhookUrl: 'https://yourdomain.com/api/webhooks/payment',
          events: ['payment.captured', 'payment.failed', 'refund.processed', 'order.paid']
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete webhook configuration');
      }
    } catch (error) {
      toast.error('Failed to delete webhook configuration');
    } finally {
      setWebhookLoading(false);
    }
  };

  // Handle Razorpay configuration delete
  const handleDeleteRazorpayConfigClick = () => {
    console.log('Delete Razorpay config triggered');
    console.log('Current razorpayConfig:', razorpayConfig);
    
    if (!razorpayConfig.keyId && !razorpayConfig.keySecret) {
      toast.error('No Razorpay configuration to delete');
      return;
    }

    setDeleteDialog({
      isOpen: true,
      type: 'razorpay',
      title: 'Delete Razorpay Configuration',
      message: 'Are you sure you want to delete the Razorpay configuration?'
    });
  };

  const handleDeleteRazorpayConfig = async () => {

    setIsLoading(true);
    
    try {
      console.log('Making DELETE request to:', getApiUrl('/admin/payments/config/razorpay'));
      const response = await fetch(getApiUrl('/admin/payments/config/razorpay'), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Success response:', responseData);
        toast.success('Razorpay configuration deleted successfully');
        setRazorpayConfig({
          keyId: '',
          keySecret: ''
        });
        setRazorpayData(null);
      } else {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        toast.error(errorData.message || 'Failed to delete Razorpay configuration');
      }
    } catch (error) {
      toast.error('Failed to delete Razorpay configuration');
    } finally {
      setIsLoading(false);
    }
  };





  const handleDeleteConfirm = async () => {
    if (deleteDialog.type === 'webhook') {
      await handleDeleteWebhook();
    } else if (deleteDialog.type === 'razorpay') {
      await handleDeleteRazorpayConfig();
    }
    setDeleteDialog({
      isOpen: false,
      type: null,
      title: '',
      message: ''
    });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      type: null,
      title: '',
      message: ''
    });
  };

  const handleSaveRazorpayConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!razorpayConfig.keyId || !razorpayConfig.keySecret) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(getApiUrl('/admin/payments/config/razorpay'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(razorpayConfig),
      });

      if (response.ok) {
        toast.success('Razorpay configuration saved successfully');
        // Update Razorpay table data
        setRazorpayData({
          keyId: razorpayConfig.keyId,
          status: 'enabled',
          lastUpdated: new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          })
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save configuration');
      }
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Integration</h1>
          <p className="text-gray-600 mt-2">Configure payment gateways and methods</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('methods')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'methods'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Methods
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'config'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Configuration
            </button>
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'webhooks'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Webhooks
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'methods' && (
          <div className="space-y-6">
            {/* Payment Methods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paymentMethods.map((method) => (
                <div key={method.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{method.name}</h3>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {method.isConfigured ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {method.features.map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        method.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {method.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        method.isConfigured
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {method.isConfigured ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            {/* Razorpay Configuration */}
            <div className="card">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Razorpay Configuration</h2>
                  <p className="text-sm text-gray-600">Configure your Razorpay payment gateway</p>
                </div>
              </div>

              <form onSubmit={handleSaveRazorpayConfig} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key ID *
                    </label>
                    <input
                      type="text"
                      value={razorpayConfig.keyId}
                      onChange={(e) => setRazorpayConfig(prev => ({ ...prev, keyId: e.target.value }))}
                      className="input-field"
                      placeholder="rzp_test_..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Secret *
                    </label>
                    <input
                      type="password"
                      value={razorpayConfig.keySecret}
                      onChange={(e) => setRazorpayConfig(prev => ({ ...prev, keySecret: e.target.value }))}
                      className="input-field"
                      placeholder="Enter your key secret"
                      required
                    />
                  </div>
                </div>



                <div className="flex items-center space-x-4">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </div>

            {/* Razorpay Configuration Table */}
            {razorpayData ? (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Razorpay Configuration</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Key ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {razorpayData.keyId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            razorpayData.status === 'enabled' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {razorpayData.status === 'enabled' ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {razorpayData.lastUpdated}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={handleDeleteRazorpayConfigClick}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Razorpay Configuration</h3>
                <div className="text-center py-8">
                  <p className="text-gray-500">No Razorpay configuration found. Configure Razorpay settings above.</p>
                </div>
              </div>
            )}

          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Webhook Configuration</h2>
                  <p className="text-sm text-gray-600">Configure webhook endpoints for payment notifications</p>
                </div>
              </div>

              <form onSubmit={handleSaveWebhookConfig} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={webhookConfig.webhookUrl}
                    onChange={(e) => setWebhookConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    className="input-field"
                    placeholder="Enter webhook URL"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Events to Listen
                  </label>
                  <div className="space-y-2">
                    {['payment.captured', 'payment.failed', 'refund.processed', 'order.paid'].map((event) => (
                      <label key={event} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={webhookConfig.events.includes(event)}
                          onChange={() => handleEventToggle(event)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={webhookLoading}
                  >
                    {webhookLoading ? 'Saving...' : 'Save Webhook Settings'}
                  </button>
                </div>
              </form>
            </div>

            {/* Webhook Configuration Table */}
            {webhookData ? (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhook Configuration</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          URL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Events
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {webhookData.url}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            webhookData.status === 'enabled' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {webhookData.status === 'enabled' ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {webhookData.events.length} events
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {webhookData.lastUpdated}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={handleDeleteWebhookClick}
                            disabled={webhookLoading}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {webhookLoading ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhook Configuration</h3>
                <div className="text-center py-8">
                  <p className="text-gray-500">No webhook configuration found. Configure webhook settings above.</p>
                </div>
              </div>
            )}

            {/* Webhook Logs */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Webhook Logs</h3>
              <div className="space-y-3">
                {[
                  { event: 'payment.captured', status: 'Success', time: '2 minutes ago' },
                  { event: 'payment.failed', status: 'Failed', time: '5 minutes ago' },
                  { event: 'refund.processed', status: 'Success', time: '1 hour ago' },
                ].map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{log.event}</p>
                      <p className="text-sm text-gray-600">{log.time}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      log.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title={deleteDialog.title}
          message={deleteDialog.message}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </DashboardLayout>
  );
} 