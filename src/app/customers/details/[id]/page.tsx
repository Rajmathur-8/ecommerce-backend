'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Calendar, MapPin, Package, Star, Gift, Clock } from 'lucide-react';
import { getApiUrl, getAuthHeaders, formatCurrency, formatNumber } from '@/lib/config';
import { CustomerDetailsSkeleton } from '@/components/Skeleton';

interface Customer {
  _id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  isGuest: boolean;
  referralCode?: string;
  referredBy?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  referralCodeUsed: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string | null;
  addresses?: Array<{
    _id: string;
    name: string;
    mobile: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    isDefault: boolean;
  }>;
  stats?: {
    totalOrders: number;
    totalSpent: number;
    totalAddresses: number;
    totalReviews: number;
    rewardPoints: {
      currentPoints: number;
      totalEarned: number;
      totalRedeemed: number;
    };
  };
  recentOrders?: Array<{
    _id: string;
    orderNumber: string;
    orderStatus: string;
    total: number;
    createdAt: string;
  }>;
  ordersPagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function CustomerDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordersPage, setOrdersPage] = useState(1);

  useEffect(() => {
    fetchCustomerDetails();
  }, [params.id, ordersPage]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(getApiUrl(`/admin/customers/${params.id}?page=${ordersPage}&limit=5`), {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch customer details');
      }
      
      const data = await response.json();
      setCustomer(data.data.customer);
    } catch (error) {
      setError('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCustomerName = (customer: Customer) => {
    if (customer.firstName && customer.lastName) return `${customer.firstName} ${customer.lastName}`;
    if (customer.firstName) return customer.firstName;
    if (customer.email) return customer.email.split('@')[0];
    if (customer.phone) return customer.phone;
    return 'Customer';
  };

  const getCustomerAvatar = (customer: Customer) => {
    const name = getCustomerName(customer);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=200`;
  };


  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: 'Customers', href: '/customers' },
            { label: 'Customer Details' }
          ]} />
          <CustomerDetailsSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !customer) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: 'Customers', href: '/customers' },
            { label: 'Customer Details' }
          ]} />
          <div className="card text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Customer Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The customer you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/customers')}
              className="btn-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Customers
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: 'Customers', href: '/customers' },
          { label: getCustomerName(customer) }
        ]} />
        
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/customers')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Customers"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{getCustomerName(customer)}</h1>
            <p className="text-gray-600">Customer Details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="text-center">
                <img
                  src={getCustomerAvatar(customer)}
                  alt={getCustomerName(customer)}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg"
                />
                <h2 className="text-xl font-semibold text-gray-900">{getCustomerName(customer)}</h2>
                <p className="text-gray-600 text-sm break-words">{customer.email || (customer.isGuest ? 'Guest User' : 'N/A')}</p>
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mt-3 ${
                  customer.isGuest 
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : 'bg-green-100 text-green-800 border border-green-200'
                }`}>
                  {customer.isGuest ? 'Guest User' : 'Active Customer'}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500">Email</p>
                    <span className="text-gray-900 font-medium break-words break-all">{customer.email || (customer.isGuest ? 'Guest User' : 'N/A')}</span>
                  </div>
                </div>
                {customer.phone && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500">Phone</p>
                      <span className="text-gray-900 font-medium break-words">{customer.phone}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Joined</p>
                    <span className="text-gray-900 font-medium">{formatDate(customer.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Last Login</p>
                    {customer.lastLogin ? (
                      <span className="text-gray-900 font-medium">{formatDate(customer.lastLogin)}</span>
                    ) : customer.isGuest ? (
                      <span className="text-gray-500 text-sm">Not applicable for guest users</span>
                    ) : (
                      <span className="text-gray-500 text-sm">Never logged in</span>
                    )}
                  </div>
                </div>
                {customer.referralCode && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Gift className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Referral Code</p>
                      <span className="text-gray-900 font-medium">{customer.referralCode}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card text-center hover:shadow-lg transition-shadow">
                <div className="p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(customer.stats?.totalOrders || 0)}</div>
                  <div className="text-sm text-gray-600">Total Orders</div>
                </div>
              </div>
              <div className="card text-center hover:shadow-lg transition-shadow">
                <div className="p-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold text-lg">₹</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(customer.stats?.totalSpent || 0)}</div>
                  <div className="text-sm text-gray-600">Total Spent</div>
                </div>
              </div>
              <div className="card text-center hover:shadow-lg transition-shadow">
                <div className="p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(customer.stats?.totalAddresses || 0)}</div>
                  <div className="text-sm text-gray-600">Addresses</div>
                </div>
              </div>
              <div className="card text-center hover:shadow-lg transition-shadow">
                <div className="p-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(customer.stats?.totalReviews || 0)}</div>
                  <div className="text-sm text-gray-600">Reviews</div>
                </div>
              </div>
            </div>

            {/* Reward Points */}
            {customer.stats?.rewardPoints && (
              <div className="card">
                <div className="flex items-center space-x-2 mb-4">
                  <Gift className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Reward Points</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{customer.stats.rewardPoints.currentPoints}</div>
                    <div className="text-sm text-gray-600 font-medium">Current Points</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{customer.stats.rewardPoints.totalEarned}</div>
                    <div className="text-sm text-gray-600 font-medium">Total Earned</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-600">{customer.stats.rewardPoints.totalRedeemed}</div>
                    <div className="text-sm text-gray-600 font-medium">Total Redeemed</div>
                  </div>
                </div>
              </div>
            )}

            {/* Addresses */}
            {customer.addresses && customer.addresses.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Addresses</h3>
                <div className="space-y-3">
                  {customer.addresses.map((address) => (
                    <div key={address._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{address.name}</h4>
                        {address.isDefault && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Default</span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">
                        {address.addressLine1}
                        {address.addressLine2 && `, ${address.addressLine2}`}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {address.city}, {address.state} - {address.pincode}
                      </p>
                      <p className="text-gray-600 text-sm">{address.country}</p>
                      <p className="text-gray-600 text-sm">Phone: {address.mobile}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order History */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order History</h3>
              {customer.recentOrders && customer.recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium text-gray-900">Order Number</th>
                        <th className="text-left py-2 font-medium text-gray-900">Status</th>
                        <th className="text-left py-2 font-medium text-gray-900">Total</th>
                        <th className="text-left py-2 font-medium text-gray-900">Date</th>
                        <th className="text-left py-2 font-medium text-gray-900">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.recentOrders.map((order) => (
                        <tr key={order._id} className="border-b hover:bg-gray-50">
                          <td className="py-3 text-gray-900 font-medium">{order.orderNumber}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 text-gray-900 font-semibold">{formatCurrency(order.total)}</td>
                          <td className="py-3 text-gray-600 text-sm">{formatDate(order.createdAt)}</td>
                          <td className="py-3">
                            <button
                              onClick={() => router.push(`/orders/details/${order._id}`)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination */}
                  {customer.ordersPagination && customer.ordersPagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Showing {((customer.ordersPagination.page - 1) * customer.ordersPagination.limit) + 1} to{' '}
                        {Math.min(customer.ordersPagination.page * customer.ordersPagination.limit, customer.ordersPagination.total)} of{' '}
                        {customer.ordersPagination.total} orders
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setOrdersPage(prev => Math.max(1, prev - 1))}
                          disabled={customer.ordersPagination.page === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700">
                          Page {customer.ordersPagination.page} of {customer.ordersPagination.pages}
                        </span>
                        <button
                          onClick={() => setOrdersPage(prev => Math.min(customer.ordersPagination!.pages, prev + 1))}
                          disabled={customer.ordersPagination.page === customer.ordersPagination.pages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No orders found</p>
                  <p className="text-gray-400 text-sm mt-1">This customer hasn't placed any orders yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}