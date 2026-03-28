'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  MoreHorizontal,
  Copy,
  Hash
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import { ProductsTableSkeleton } from '@/components/Skeleton';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(10); // Default value
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    productId: string | null;
    productName: string;
  }>({
    isOpen: false,
    productId: null,
    productName: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStock, setSelectedStock] = useState('in_stock');

  // Simple fetch function
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const productsResponse = await fetch(getApiUrl('/web/products'), {
        headers: getAuthHeaders()
      });
      const productsData = await productsResponse.json();
      setProducts(productsData.data || []);

      // Fetch categories
      const categoriesResponse = await fetch(getApiUrl('/web/categories'), {
        headers: getAuthHeaders()
      });
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData.data || []);

      // Fetch settings for low stock threshold
      try {
        const settingsResponse = await fetch(getApiUrl('/admin/settings'), {
          headers: getAuthHeaders()
        });
        const settingsData = await settingsResponse.json();
        if (settingsData.success && settingsData.data?.stockAlertSettings?.lowStockThreshold) {
          setLowStockThreshold(settingsData.data.stockAlertSettings.lowStockThreshold);
        }
      } catch (settingsError) {
        // Use default value if settings fetch fails
      }
      
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(loading){
    fetchData();
    }
  }, [loading]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('SKU copied to clipboard!');
  };

  const handleDeleteClick = (productId: string, productName: string) => {
    setDeleteDialog({
      isOpen: true,
      productId,
      productName
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.productId) return;
    
    try {
      const response = await fetch(getApiUrl(`/web/products/${deleteDialog.productId}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        toast.success('Product deleted successfully!');
        // Refresh data
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete product');
      }
    } catch (error) {
      toast.error('Failed to delete product. Please try again.');
    } finally {
      setDeleteDialog({
        isOpen: false,
        productId: null,
        productName: ''
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      productId: null,
      productName: ''
    });
  };

  // Get unique brands from products
  const uniqueBrands = Array.from(
    new Set(
      products
        .map(p => p.brandName)
        .filter(brand => brand && brand.trim() !== '')
    )
  ).sort();

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           product.category?.name === selectedCategory ||
                           product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || 
                         product.status === selectedStatus ||
                         (product.isActive ? 'Active' : 'Inactive') === selectedStatus;
    const matchesBrand = selectedBrand === 'all' || 
                        product.brandName === selectedBrand;
    // Pre-order products should always be shown regardless of stock filter
    const isPreOrder = product.isPreOrder === true;
    
    const matchesStock = isPreOrder || // Always show pre-order products
                        (selectedStock === 'in_stock' && (product.stock || 0) > lowStockThreshold) ||
                        (selectedStock === 'low_stock' && (product.stock || 0) > 0 && (product.stock || 0) <= lowStockThreshold) ||
                        (selectedStock === 'out_of_stock' && (product.stock || 0) === 0);
    
    return matchesSearch && matchesCategory && matchesStatus && matchesBrand && matchesStock;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600 mt-2">Manage your product catalog</p>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Filters Skeleton */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={`h-10 bg-gray-200 rounded animate-pulse ${index === 0 ? 'md:col-span-2' : ''}`}></div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Products Table Skeleton */}
          <ProductsTableSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Products' }]} />
        
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-2">Manage your product catalog</p>
          </div>
          <Link
            href="/products/add"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Product</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Brand Filter */}
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="input-field"
            >
              <option value="all">All Brands</option>
              {uniqueBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="input-field"
            >
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSelectedBrand('all');
                setSelectedStock('in_stock');
              }}
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">SKU</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product._id || product.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name || product.productName}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.name || product.productName}</p>
                            <p className="text-sm text-gray-600">ID: {product._id || product.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {product.sku ? (
                            <>
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {product.sku}
                              </span>
                              <button
                                onClick={() => copyToClipboard(product.sku)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="Copy SKU"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500 flex items-center space-x-1">
                              <Hash className="w-3 h-3" />
                              <span>Auto-generated</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {product.category?.name || product.category || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium">
                        {product.isPreOrder ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Pre-Order
                          </span>
                        ) : product.discountPrice ? (
                          <div>
                            <span className="text-gray-900">₹{product.discountPrice}</span>
                            <span className="text-sm text-gray-500 ml-2 line-through">₹{product.price}</span>
                          </div>
                        ) : product.price ? (
                          <span className="text-gray-900">₹{product.price}</span>
                        ) : (
                          <span className="text-gray-400 italic">Price TBA</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-medium ${
                          product.stock > 10 ? 'text-green-600' : 
                          product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {product.stock || 0}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          (product.isActive || product.status === 'Active') 
                            ? 'bg-green-100 text-green-800'
                            : (product.status === 'Inactive' || !product.isActive)
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Active' : product.status || 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/products/view/${product._id || product.id}`}
                            className="p-1 text-gray-600 hover:text-gray-900"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/products/edit/${product._id || product.id}`}
                            className="p-1 text-gray-600 hover:text-gray-900"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => handleDeleteClick(product._id || product.id, product.name || product.productName)}
                            className="p-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing 1 to {filteredProducts.length} of {products.length} results
            </p>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1 bg-primary-600 text-white rounded-md text-sm">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteDialog.productName}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </DashboardLayout>
  );
} 