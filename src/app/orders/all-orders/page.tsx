'use client';

export const dynamic = 'force-dynamic';

import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Eye, Package, Truck, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { getApiUrl, getAuthHeaders, formatCurrency, formatNumber } from '@/lib/config';
import { TableSkeleton } from '@/components/Skeleton';
import { useRouter } from 'next/navigation';


interface Order {
  _id: string;
  user: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  items: Array<{
    product: {
      _id: string;
      productName: string;
      images: string[];
      price: number;
    } | null;
    manualProduct?: {
      productName: string;
      images: string[];
      price: number;
      discountPrice?: number;
      sku?: string;
      isManual: boolean;
    };
    quantity: number;
    price: number;
    variant?: string;
    isFrequentlyBoughtTogether?: boolean;
  }>;
  address: {
    name: string;
    mobile: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  subtotal: number;
  discountAmount: number;
  couponDiscount?: number;
  promoDiscount?: number;
  giftVoucherDiscount?: number;
  rewardPointsDiscount?: number;
  shippingCharges: number;
  total: number;
  trackingNumber?: string;
  estimatedDelivery?: string;
  returnReason?: string;
  returnDescription?: string;
  returnDate?: string;
  isPreOrder?: boolean;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'confirmed': 'bg-blue-100 text-blue-800',
  'shipped': 'bg-purple-100 text-purple-800',
  'delivered': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800',
  'returned': 'bg-orange-100 text-orange-800',
};

const paymentStatusColors = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'completed': 'bg-green-100 text-green-800',
  'failed': 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [selectedPreOrder, setSelectedPreOrder] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const router=useRouter()
  // Simple fetch function
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedPaymentStatus !== 'all' && { paymentStatus: selectedPaymentStatus }),
        ...(selectedPreOrder !== 'all' && { isPreOrder: selectedPreOrder === 'true' ? 'true' : 'false' })
      });

      const response = await fetch(getApiUrl(`/admin/orders?${params}`), {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      setOrders(data.data.orders);
      setTotalPages(data.data.pagination.totalPages);
      setTotalOrders(data.data.pagination.totalOrders);
    } catch (error) {
      setOrders([]);
      setTotalPages(1);
      setTotalOrders(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedStatus, selectedPaymentStatus, selectedPreOrder]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle filter changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
  }, [selectedStatus, selectedPaymentStatus, selectedPreOrder]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(getApiUrl(`/admin/orders/${orderId}/status`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      if (response.ok) {
        // Refresh orders after status update
        fetchOrders();
      } else {
      }
    } catch (error) {
    }
  };

  // No need for client-side filtering since we're using server-side filtering
  const filteredOrders = orders;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <Package className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'returned':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Breadcrumbs items={[{ label: 'Orders' }]} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-2">Manage customer orders and fulfillment</p>
          </div>
          
          {/* Filters Skeleton */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-10 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Orders Table Skeleton */}
          <TableSkeleton rows={8} columns={8} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Orders' }]} />
        
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-2">Manage customer orders and fulfillment</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>

            {/* Payment Status Filter */}
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Payment Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            {/* Pre-Order Filter */}
            <select
              value={selectedPreOrder}
              onChange={(e) => setSelectedPreOrder(e.target.value)}
              className="input-field"
            >
              <option value="all">All Orders</option>
              <option value="true">Pre-Orders</option>
              <option value="false">Regular Orders</option>
            </select>
          </div>
          
          {/* Clear Filters Button */}
          <div className="mt-4">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('all');
                setSelectedPaymentStatus('all');
                setSelectedPreOrder('all');
              }}
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Order ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Products</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Payment</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr 
                    key={order._id} 
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/orders/details/${order._id}`)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">#{order._id.slice(-8)}</p>
                        {order.isPreOrder && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-pink-100 text-pink-800">
                            Pre-Order
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.user.firstName && order.user.lastName 
                            ? `${order.user.firstName} ${order.user.lastName}`
                            : order.user.email.split('@')[0]
                          }
                        </p>
                        <p className="text-sm text-gray-600">{order.user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {order.items.filter((item) => !item.isFrequentlyBoughtTogether).map((item, index) => {
                          const productName = item.manualProduct?.productName || item.product?.productName || 'Product';
                          // Parse variant if it exists
                          let variantDisplay = null;
                          if (item.variant) {
                            try {
                              const variantData = typeof item.variant === 'string' ? JSON.parse(item.variant) : item.variant;
                              if (variantData && typeof variantData === 'object' && !Array.isArray(variantData)) {
                                const attributes = variantData.attributes || variantData;
                                const variantAttrs = Object.entries(attributes)
                                  .filter(([key, value]) => 
                                    key !== 'price' && 
                                    key !== 'stock' && 
                                    key !== 'discountPrice' && 
                                    key !== 'variantName' && 
                                    key !== 'attributes' && 
                                    key !== 'sku' &&
                                    (typeof value === 'string' || typeof value === 'number') &&
                                    value !== '' &&
                                    value !== null &&
                                    value !== undefined
                                  )
                                  .map(([, value]) => String(value))
                                  .join(', ');
                                
                                if (variantAttrs) {
                                  variantDisplay = variantAttrs;
                                } else if (variantData.variantName) {
                                  variantDisplay = variantData.variantName;
                                }
                              }
                            } catch (error) {
                              // If parsing fails, ignore variant
                            }
                          }
                          
                          return (
                            <div key={index} className="text-sm">
                              <span className="text-gray-900">{productName}</span>
                              {variantDisplay && (
                                <span className="text-gray-500 text-xs ml-1">({variantDisplay})</span>
                              )}
                              <span className="text-gray-600"> x{item.quantity}</span>
                              <span className="text-gray-600"> ({formatCurrency(item.price)})</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{formatCurrency(order.total)}</p>
                        {order.discountAmount > 0 && (
                          <p className="text-sm text-green-600">-{formatCurrency(order.discountAmount)}</p>
                        )}
                        {order.couponDiscount !== undefined && order.couponDiscount > 0 && (
                          <p className="text-xs text-green-600">Coupon: -{formatCurrency(order.couponDiscount)}</p>
                        )}
                        {order.promoDiscount !== undefined && order.promoDiscount > 0 && (
                          <p className="text-xs text-green-600">Promo: -{formatCurrency(order.promoDiscount)}</p>
                        )}
                        {order.giftVoucherDiscount !== undefined && order.giftVoucherDiscount > 0 && (
                          <p className="text-xs text-green-600">Gift: -{formatCurrency(order.giftVoucherDiscount)}</p>
                        )}
                        {order.rewardPointsDiscount !== undefined && order.rewardPointsDiscount > 0 && (
                          <p className="text-xs text-green-600">Reward: -{formatCurrency(order.rewardPointsDiscount)}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          statusColors[order.orderStatus]
                        }`}>
                          {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          paymentStatusColors[order.paymentStatus]
                        }`}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                        <p className="text-xs text-gray-600 mt-1">{order.paymentMethod}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-900">{formatDate(order.createdAt)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalOrders)} of {formatNumber(totalOrders)} results
            </p>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 