'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ArrowLeft, TrendingUp, Users, ShoppingCart, DollarSign, Tag } from 'lucide-react';
import { apiCall, formatCurrency, formatNumber } from '@/lib/config';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface PromoAnalytics {
  promo: {
    _id: string;
    code: string;
    name: string;
    description: string;
    type: string;
    value: number;
    minimumAmount: number;
    maximumDiscount?: number;
    usageLimit?: number;
    usedCount: number;
    validFrom: string;
    validUntil?: string;
    isActive: boolean;
  };
  statistics: {
    totalUsage: number;
    totalDiscount: number;
    totalRevenue: number;
    uniqueUsersCount: number;
    averageOrderValue: number;
  };
  orders: Array<{
    orderNumber: string;
    user: {
      name: string;
      email: string;
    };
    discountAmount: number;
    orderTotal: number;
    orderDate: string;
    orderStatus: string;
  }>;
}

export default function PromoAnalyticsPage() {
  const params = useParams();
  const promoId = params.id as string;
  const [analytics, setAnalytics] = useState<PromoAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (promoId) {
      fetchAnalytics();
    }
  }, [promoId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/admin/promos/${promoId}/analytics`);
      if (response.data.success) {
        setAnalytics(response.data.data);
      } else {
        toast.error('Failed to load promo analytics');
      }
    } catch (error) {
      toast.error('Failed to load promo analytics');
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Promo analytics not found</p>
          <Link href="/promos" className="text-primary-600 hover:text-primary-900 mt-4 inline-block">
            Back to Promos
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumbs items={[
            { label: 'Promo Management', href: '/promos/management' },
            { label: 'Analytics' }
          ]} />
          <div className="flex items-center space-x-4 mt-4">
            <Link
              href="/promos/management"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{analytics.promo.name}</h1>
              <p className="text-gray-600 mt-1">
                <span className="font-mono font-semibold text-primary-700">{analytics.promo.code}</span>
                {' • '}
                {analytics.promo.type === 'percentage' ? `${analytics.promo.value}%` :
                 analytics.promo.type === 'fixed' ? `₹${analytics.promo.value}` :
                 analytics.promo.type === 'free_shipping' ? 'Free Shipping' :
                 'Buy One Get One'}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(analytics.statistics.totalUsage)}
                </p>
                {analytics.promo.usageLimit && (
                  <p className="text-xs text-gray-500 mt-1">
                    Limit: {formatNumber(analytics.promo.usageLimit)}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Discount</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(analytics.statistics.totalDiscount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(analytics.statistics.totalRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg: {formatCurrency(analytics.statistics.averageOrderValue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(analytics.statistics.uniqueUsersCount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Promo Details */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Promo Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {analytics.promo.description || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Minimum Amount</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {formatCurrency(analytics.promo.minimumAmount)}
              </p>
            </div>
            {analytics.promo.maximumDiscount && (
              <div>
                <p className="text-sm text-gray-600">Maximum Discount</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {formatCurrency(analytics.promo.maximumDiscount)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                analytics.promo.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {analytics.promo.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valid From</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {formatDate(analytics.promo.validFrom)}
              </p>
            </div>
            {analytics.promo.validUntil && (
              <div>
                <p className="text-sm text-gray-600">Valid Until</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {formatDate(analytics.promo.validUntil)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Orders with this Promo</h2>
          {analytics.orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.orders.map((order) => (
                    <tr key={order.orderNumber} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.user.name}</div>
                        <div className="text-sm text-gray-500">{order.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(order.discountAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.orderTotal)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(order.orderDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          getStatusColor(order.orderStatus)
                        }`}>
                          {order.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No orders found with this promo</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

