'use client';

export const dynamic = 'force-dynamic';

import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Mail, Phone, Calendar, Eye } from 'lucide-react';
import { getApiUrl, getAuthHeaders, formatCurrency } from '@/lib/config';
import { CustomerSkeleton, TableSkeleton } from '@/components/Skeleton';

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
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Simple fetch function
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedStatus !== 'all' && { status: selectedStatus })
      });

      const response = await fetch(getApiUrl(`/admin/customers?${params}`), {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      setCustomers(data.data.customers);
      setTotalPages(data.data.pagination.pages);
      setTotalCustomers(data.data.pagination.total);
    } catch (error) {
      setCustomers([]);
      setTotalPages(1);
      setTotalCustomers(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedStatus]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle status filter changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
  }, [selectedStatus]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // No need for client-side filtering since we're using server-side filtering
  const filteredCustomers = customers;


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=100`;
  };

  // Handle view customer
  const handleViewCustomer = (customerId: string) => {
    router.push(`/customers/details/${customerId}`);
  };



  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Breadcrumbs items={[{ label: 'Customers' }]} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-2">Manage your customer database</p>
          </div>

          {/* Filters Skeleton */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-10 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Customers Table Skeleton */}
          <TableSkeleton rows={8} columns={8} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Customers' }]} />
        
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">Manage your customer database</p>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search customers..."
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
              <option value="all">All Customers</option>
              <option value="active">Active Customers</option>
              <option value="guest">Guest Users</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('all');
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Customers Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Contact</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Join Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Orders</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Reward Points</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2 max-w-[200px]">
                        <img
                          src={getCustomerAvatar(customer)}
                          alt={getCustomerName(customer)}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <span className="font-medium text-gray-900 truncate">{getCustomerName(customer)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-900 truncate block max-w-[200px]">{customer.email || customer.phone || '—'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-900 whitespace-nowrap">{formatDate(customer.createdAt)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                        {customer.stats?.totalOrders || 0} orders
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                        {customer.stats?.rewardPoints?.currentPoints !== undefined && customer.stats?.rewardPoints?.currentPoints !== null
                          ? (customer.stats.rewardPoints.currentPoints >= 10000 
                              ? `${(customer.stats.rewardPoints.currentPoints / 1000).toFixed(1)}K pts`
                              : `${customer.stats.rewardPoints.currentPoints} pts`
                            )
                          : '0 pts'
                        }
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                        customer.isGuest 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {customer.isGuest ? 'Guest' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => handleViewCustomer(customer._id)}
                          className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCustomers || 0)} of {totalCustomers || 0} results
            </p>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages || 1, prev + 1))}
                disabled={currentPage === (totalPages || 1) || loading}
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