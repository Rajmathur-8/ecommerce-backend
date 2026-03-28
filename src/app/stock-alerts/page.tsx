'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  Search,
  Filter,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import { TableSkeleton, CardSkeleton } from '@/components/Skeleton';

interface StockAlert {
  _id: string;
  productName: string;
  sku: string;
  currentStock: number;
  lowStockThreshold: number;
  category: string;
  subcategory?: string;
  price: number;
  lastStockAlertSent?: string;
  stockStatus: 'Out of Stock' | 'Low Stock' | 'In Stock';
}

export default function StockAlertsPage() {
  const [lowStockProducts, setLowStockProducts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(getApiUrl('/admin/categories'), {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        const categoryNames = data.data?.map((cat: any) => cat.name) || [];
        setCategories(categoryNames);
      }
    } catch (error) {
    }
  }, []);

  const fetchStockAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedCategory !== 'all' && { category: selectedCategory })
      });

      const response = await fetch(getApiUrl(`/admin/stock-alerts/low-stock?${params}`), {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setLowStockProducts(data.data.products || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      } else {
        toast.error('Failed to fetch stock alerts');
        setLowStockProducts([]);
        setTotalPages(1);
      }
    } catch (error) {
      toast.error('Failed to fetch stock alerts');
      setLowStockProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedStatus, selectedCategory]);

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
    fetchStockAlerts();
  }, [fetchCategories, fetchStockAlerts]);

  // Debounce search term to prevent excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle filter changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedStatus, selectedCategory]);

  const triggerStockAlert = async (productId: string) => {
    try {
      const response = await fetch(getApiUrl(`/admin/stock-alerts/trigger/${productId}`), {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        toast.success('Stock alert triggered successfully!');
        fetchStockAlerts(); // Refresh the list
      } else {
        toast.error('Failed to trigger stock alert');
      }
    } catch (error) {
      toast.error('Failed to trigger stock alert');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Out of Stock':
        return 'bg-red-100 text-red-800';
      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Out of Stock':
        return <XCircle className="w-4 h-4" />;
      case 'Low Stock':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stock Alerts</h1>
              <p className="text-gray-600 mt-2">Monitor and manage low stock products</p>
            </div>
          </div>

          {/* Filters Skeleton */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-10 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Table Skeleton */}
          <TableSkeleton rows={8} columns={7} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Alerts</h1>
            <p className="text-gray-600 mt-2">Monitor and manage low stock products</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="In Stock">In Stock</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('all');
                setSelectedCategory('all');
              }}
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        {/* Low Stock Products Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[200px]">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[120px]">SKU</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[80px]">Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[80px]">Threshold</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[120px]">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[100px]">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[100px]">Last Alert</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">No low stock products found</p>
                        <p className="text-gray-600">Try adjusting your filters or search terms</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  lowStockProducts.map((product) => (
                    <tr key={product._id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{product.productName}</p>
                          <p className="text-sm text-gray-600">₹{product.price}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {product.sku || 'N/A'}
                          </span>
                          {product.sku && (
                            <button
                              onClick={() => copyToClipboard(product.sku)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Copy SKU"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-medium ${
                          product.currentStock === 0 ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {product.currentStock}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-600">{product.lowStockThreshold}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{product.category || 'N/A'}</p>
                          {product.subcategory && (
                            <p className="text-sm text-gray-600 truncate">{product.subcategory}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(product.stockStatus)}`}>
                          {getStatusIcon(product.stockStatus)}
                          <span className="ml-1">{product.stockStatus}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {product.lastStockAlertSent 
                            ? new Date(product.lastStockAlertSent).toLocaleDateString()
                            : 'Never'
                          }
                        </span>
                      </td>
                   
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
