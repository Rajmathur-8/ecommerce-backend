'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, X, CheckCircle, Info, TrendingDown, Package, DollarSign } from 'lucide-react';
import { getProductAlerts, type ProductAlerts, getAlertSeverity, getAlertIcon, getAlertMessage, formatCurrency } from '@/lib/productService';
import toast from 'react-hot-toast';

interface ProductAlertsProps {
  showSummary?: boolean;
  maxAlerts?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onAlertClick?: (alert: any) => void;
}

export default function ProductAlerts({ 
  showSummary = true, 
  maxAlerts = 10, 
  autoRefresh = false,
  refreshInterval = 30000,
  onAlertClick 
}: ProductAlertsProps) {
  const [alerts, setAlerts] = useState<ProductAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'high' | 'medium'>('all');

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProductAlerts();
      setAlerts(data);
    } catch (error) {
      toast.error('Failed to fetch product alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchAlerts, autoRefresh, refreshInterval]);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Loading alerts...</span>
        </div>
      </div>
    );
  }

  if (!alerts) {
    return null;
  }

  const allAlerts = [
    ...alerts.outOfStock.map(alert => ({ ...alert, severity: 'critical' })),
    ...alerts.lowStock.map(alert => ({ ...alert, severity: 'high' })),
    ...alerts.priceIssues.map(alert => ({ ...alert, severity: 'medium' })),
    ...alerts.variantIssues.map(alert => ({ ...alert, severity: getAlertSeverity(alert.type) }))
  ];

  const filteredAlerts = activeTab === 'all' 
    ? allAlerts 
    : allAlerts.filter(alert => alert.severity === activeTab);

  const displayedAlerts = expanded ? filteredAlerts : filteredAlerts.slice(0, maxAlerts);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <TrendingDown className="w-4 h-4" />;
      case 'medium': return <Info className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {showSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card bg-red-50 border-red-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Package className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-700">{alerts.summary.outOfStock}</p>
              </div>
            </div>
          </div>

          <div className="card bg-orange-50 border-orange-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-700">{alerts.summary.lowStock}</p>
              </div>
            </div>
          </div>

          <div className="card bg-yellow-50 border-yellow-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Price Issues</p>
                <p className="text-2xl font-bold text-yellow-700">{alerts.summary.priceIssues}</p>
              </div>
            </div>
          </div>

          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">SKU Issues</p>
                <p className="text-2xl font-bold text-blue-700">{alerts.summary.skuIssues}</p>
              </div>
            </div>
          </div>

          <div className="card bg-purple-50 border-purple-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Variant Issues</p>
                <p className="text-2xl font-bold text-purple-700">{alerts.summary.variantIssues}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Product Alerts</h3>
            {alerts.summary.totalAlerts > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                {alerts.summary.totalAlerts}
              </span>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-4">
          {[
            { key: 'all', label: 'All', count: allAlerts.length },
            { key: 'critical', label: 'Critical', count: allAlerts.filter(a => a.severity === 'critical').length },
            { key: 'high', label: 'High', count: allAlerts.filter(a => a.severity === 'high').length },
            { key: 'medium', label: 'Medium', count: allAlerts.filter(a => a.severity === 'medium').length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        {displayedAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <p>No alerts found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedAlerts.map((alert, index) => (
              <div
                key={`${alert.id}-${index}`}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => onAlertClick?.(alert)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{getAlertMessage(alert)}</p>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-600">
                        <span>SKU: {alert.sku}</span>
                        {alert.category && <span>Category: {alert.category}</span>}
                        {alert.currentStock !== undefined && (
                          <span>Stock: {alert.currentStock}</span>
                        )}
                        {alert.price && (
                          <span>Price: {formatCurrency(alert.price)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <span className="text-xs font-medium uppercase tracking-wide">
                      {alert.severity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show More/Less Button */}
        {filteredAlerts.length > maxAlerts && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {expanded ? 'Show Less' : `Show ${filteredAlerts.length - maxAlerts} More`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
