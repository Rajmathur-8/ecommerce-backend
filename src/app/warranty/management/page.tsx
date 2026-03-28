'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Shield, Users, Package, TrendingUp, Search, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { apiCall, formatCurrency, formatNumber } from '@/lib/config';
import toast from 'react-hot-toast';

interface WarrantyStats {
  totalWarranties: number;
  activeWarranties: number;
  totalSold: number;
  totalRevenue: number;
  activeWarrantiesCount: number;
  expiredWarrantiesCount: number;
}

interface UserWarranty {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  totalWarranties: number;
  activeWarranties: number;
  expiredWarranties: number;
  totalSpent: number;
  warranties: Array<{
    warrantyId: string;
    warrantyName: string;
    productName: string;
    orderId: string;
    orderNumber: string;
    purchaseDate: string;
    expiryDate: string;
    status: 'active' | 'expired';
    price: number;
  }>;
}

interface ProductWarranty {
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  totalWarrantiesSold: number;
  totalRevenue: number;
  warranties: Array<{
    warrantyId: string;
    warrantyName: string;
    price: number;
    duration: number;
    count: number;
    revenue: number;
  }>;
}

export default function WarrantyManagementPage() {
  const [stats, setStats] = useState<WarrantyStats | null>(null);
  const [userWarranties, setUserWarranties] = useState<UserWarranty[]>([]);
  const [productWarranties, setProductWarranties] = useState<ProductWarranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await apiCall('/admin/warranty/management/stats');
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
      
      // Fetch user warranties
      const usersResponse = await apiCall('/admin/warranty/management/users');
      if (usersResponse.data.success) {
        setUserWarranties(usersResponse.data.data);
      }
      
      // Fetch product warranties
      const productsResponse = await apiCall('/admin/warranty/management/products');
      if (productsResponse.data.success) {
        setProductWarranties(productsResponse.data.data);
      }
    } catch (error) {
      toast.error('Failed to load warranty data');
    } finally {
      setLoading(false);
    }
  };

  const filteredUserWarranties = userWarranties.filter(user =>
    user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProductWarranties = productWarranties.filter(product =>
    product.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userTotalPages = Math.ceil(filteredUserWarranties.length / itemsPerPage);
  const userStartIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUserWarranties = filteredUserWarranties.slice(userStartIndex, userStartIndex + itemsPerPage);

  const productTotalPages = Math.ceil(filteredProductWarranties.length / itemsPerPage);
  const productStartIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProductWarranties = filteredProductWarranties.slice(productStartIndex, productStartIndex + itemsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  return (
    <DashboardLayout>
      <div className="p-6">
        <Breadcrumbs items={[
          { label: 'Warranty', href: '/warranty' },
          { label: 'Management', href: '/warranty/management' }
        ]} />
        
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Warranty Management</h1>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: Shield },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'products', label: 'Products', icon: Package }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Warranties</p>
                        <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalWarranties)}</p>
                      </div>
                      <Shield className="w-12 h-12 text-blue-500" />
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Active Warranties</p>
                        <p className="text-2xl font-bold text-green-600">{formatNumber(stats.activeWarranties)}</p>
                      </div>
                      <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Sold</p>
                        <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalSold)}</p>
                      </div>
                      <TrendingUp className="w-12 h-12 text-purple-500" />
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
                      </div>
                      <TrendingUp className="w-12 h-12 text-green-500" />
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Active Warranty Count</p>
                        <p className="text-2xl font-bold text-blue-600">{formatNumber(stats.activeWarrantiesCount)}</p>
                      </div>
                      <CheckCircle className="w-12 h-12 text-blue-500" />
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Expired Warranty Count</p>
                        <p className="text-2xl font-bold text-red-600">{formatNumber(stats.expiredWarrantiesCount)}</p>
                      </div>
                      <XCircle className="w-12 h-12 text-red-500" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="card text-center py-12">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field w-full pl-10"
              />
            </div>

            {loading ? (
              <div className="card">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : paginatedUserWarranties.length === 0 ? (
              <div className="card text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No user warranties found</p>
              </div>
            ) : (
              <>
                <div className="card overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium text-gray-700">User</th>
                        <th className="text-left p-4 font-medium text-gray-700">Total Warranties</th>
                        <th className="text-left p-4 font-medium text-gray-700">Active</th>
                        <th className="text-left p-4 font-medium text-gray-700">Expired</th>
                        <th className="text-left p-4 font-medium text-gray-700">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUserWarranties.map((user) => (
                        <tr key={user.userId} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-gray-900">{user.userName}</p>
                              <p className="text-sm text-gray-500">{user.userEmail}</p>
                            </div>
                          </td>
                          <td className="p-4">{formatNumber(user.totalWarranties)}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              {formatNumber(user.activeWarranties)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                              {formatNumber(user.expiredWarranties)}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-green-600">
                            {formatCurrency(user.totalSpent)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {userTotalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="btn-secondary px-4 py-2 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {userTotalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(userTotalPages, prev + 1))}
                      disabled={currentPage === userTotalPages}
                      className="btn-secondary px-4 py-2 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field w-full pl-10"
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="h-32 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : paginatedProductWarranties.length === 0 ? (
              <div className="card text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No product warranties found</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedProductWarranties.map((product) => (
                    <div key={product.productId} className="card">
                      {product.productImage && (
                        <img
                          src={product.productImage}
                          alt={product.productName}
                          className="w-full h-32 object-cover rounded mb-4"
                        />
                      )}
                      <h3 className="font-semibold text-gray-900 mb-2">{product.productName}</h3>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Warranties Sold:</span>
                          <span className="font-medium">{formatNumber(product.totalWarrantiesSold)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Revenue:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(product.totalRevenue)}
                          </span>
                        </div>
                      </div>
                      {product.warranties.length > 0 && (
                        <div className="border-t pt-4">
                          <p className="text-xs font-medium text-gray-700 mb-2">Warranty Plans:</p>
                          <div className="space-y-1">
                            {product.warranties.map((warranty, idx) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="text-gray-600">{warranty.warrantyName}</span>
                                <span className="font-medium">{warranty.count} sold</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {productTotalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="btn-secondary px-4 py-2 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {productTotalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(productTotalPages, prev + 1))}
                      disabled={currentPage === productTotalPages}
                      className="btn-secondary px-4 py-2 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

