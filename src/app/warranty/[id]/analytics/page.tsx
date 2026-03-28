'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Shield, TrendingUp, Users, Package, Calendar, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { apiCall, formatCurrency } from '@/lib/config';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface WarrantyAnalytics {
  warranty: {
    _id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    coverage: string[];
  };
  summary: {
    totalUsage: number;
    totalRevenue: number;
    activeCount: number;
    expiredCount: number;
    uniqueUsers: number;
  };
  orders: Array<{
    orderId: string;
    orderNumber: string;
    user: {
      _id: string;
      name: string;
      email: string;
    };
    product: {
      _id: string;
      productName: string;
    };
    purchaseDate: string;
    expiryDate: string;
    status: 'active' | 'expired';
    price: number;
  }>;
}

export default function WarrantyAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const warrantyId = params.id as string;
  const [analytics, setAnalytics] = useState<WarrantyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (warrantyId) {
      fetchAnalytics();
    }
  }, [warrantyId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/admin/warranty/${warrantyId}/analytics`);
      if (response.data.success) {
        setAnalytics(response.data.data);
        setCurrentPage(1); // Reset to first page when data loads
      } else {
        toast.error('Failed to load warranty analytics');
        router.push('/warranty');
      }
    } catch (error) {
      toast.error('Failed to load warranty analytics');
      router.push('/warranty');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  // Pagination logic
  const totalPages = Math.ceil((analytics?.orders.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = analytics?.orders.slice(startIndex, endIndex) || [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="card animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="card text-center py-12">
            <p className="text-gray-500">Warranty not found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <Breadcrumbs items={[
          { label: 'Warranty', href: '/warranty' },
          { label: analytics.warranty.name, href: `/warranty/${warrantyId}/analytics` }
        ]} />
        
        <div className="mb-6">
          <Link
            href="/warranty"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Warranties
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Warranty Analytics</h1>
        </div>

        {/* Warranty Details */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Warranty Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Name</p>
              <p className="font-medium text-gray-900">{analytics.warranty.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Duration</p>
              <p className="font-medium text-gray-900">{analytics.warranty.duration} months</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Price</p>
              <p className="font-medium text-green-600">{formatCurrency(analytics.warranty.price)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Description</p>
              <p className="font-medium text-gray-900">{analytics.warranty.description || 'N/A'}</p>
            </div>
            {analytics.warranty.coverage && analytics.warranty.coverage.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-2">Coverage</p>
                <div className="flex flex-wrap gap-2">
                  {analytics.warranty.coverage.map((item, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary.totalUsage}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(analytics.summary.totalRevenue)}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-2xl font-bold text-green-600">{analytics.summary.activeCount}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Expired</p>
                <p className="text-2xl font-bold text-red-600">{analytics.summary.expiredCount}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Unique Users</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.summary.uniqueUsers}</p>
              </div>
              <Users className="w-12 h-12 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Associated Orders</h2>
          {analytics.orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders found for this warranty</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-gray-700">Order Number</th>
                      <th className="text-left p-4 font-medium text-gray-700">User</th>
                      <th className="text-left p-4 font-medium text-gray-700">Product</th>
                      <th className="text-left p-4 font-medium text-gray-700">Purchase Date</th>
                      <th className="text-left p-4 font-medium text-gray-700">Expiry Date</th>
                      <th className="text-left p-4 font-medium text-gray-700">Status</th>
                      <th className="text-left p-4 font-medium text-gray-700">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order) => (
                      <tr key={order.orderId} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <Link
                            href={`/orders/details/${order.orderId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900">{order.user.name}</p>
                            <p className="text-sm text-gray-500">{order.user.email}</p>
                          </div>
                        </td>
                        <td className="p-4">{order.product.productName}</td>
                        <td className="p-4">{formatDate(order.purchaseDate)}</td>
                        <td className="p-4">{formatDate(order.expiryDate)}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              order.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {order.status === 'active' ? 'Active' : 'Expired'}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-green-600">
                          {formatCurrency(order.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

