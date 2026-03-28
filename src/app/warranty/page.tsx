'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Edit, Trash2, Plus, Search, Eye, Shield, Calendar, TrendingUp, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiCall } from '@/lib/config';
import ConfirmDialog from '@/components/ConfirmDialog';
import Link from 'next/link';

interface Warranty {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  coverage: string[];
  applicableProducts?: any[];
  applicableCategories?: any[];
  isActive: boolean;
  termsAndConditions?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
  totalRevenue?: number;
}

export default function WarrantyPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [durationFilter, setDurationFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    warrantyId: string | null;
    warrantyName: string;
  }>({
    isOpen: false,
    warrantyId: null,
    warrantyName: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [formData, setFormData] = useState({
    applicableCategories: [] as string[],
    productPlans: [] as Array<{
      productId: string;
      productName: string;
      plans: Array<{
        name: string;
        description: string;
        duration: string;
        price: string;
        coverage: string[];
        termsAndConditions: string;
        isActive: boolean;
      }>;
    }>
  });
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    fetchWarranties();
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, durationFilter]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown]);

  const fetchWarranties = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/admin/warranty/stats');
      if (response.data.success) {
        setWarranties(response.data.data);
      } else {
        toast.error('Failed to load warranties');
      }
    } catch (error) {
      toast.error('Failed to load warranties');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiCall('/web/products?limit=100');
      if (response.data.success) {
        setProducts(response.data.data || []);
      }
    } catch (error) {
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiCall('/web/categories');
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteDialog({
      isOpen: true,
      warrantyId: id,
      warrantyName: name
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.warrantyId) return;

    try {
      const response = await apiCall(`/admin/warranty/${deleteDialog.warrantyId}`, {
        method: 'DELETE'
      });

      // Check if API call was successful
      if (response.success) {
        // Check if backend operation was successful
        if (response.data?.success) {
          toast.success('Warranty deleted successfully!');
          fetchWarranties();
        } else {
          // Backend returned success: false with error message
          const errorMessage = response.data?.message || 'Failed to delete warranty';
          toast.error(errorMessage);
        }
      } else {
        // API call failed (HTTP error, network error, etc.)
        const errorMessage = response.error || 'Failed to delete warranty';
        toast.error(errorMessage);
      }
    } catch (error: any) {
      // Handle unexpected errors
      const errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        'Failed to delete warranty';
      toast.error(errorMessage);
    } finally {
      setDeleteDialog({
        isOpen: false,
        warrantyId: null,
        warrantyName: ''
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      warrantyId: null,
      warrantyName: ''
    });
  };

  const handleEdit = (warranty: Warranty) => {
    // For editing, we'll convert the warranty to the new structure
    const applicableProducts = warranty.applicableProducts?.map((p: any) => p._id || p) || [];
    const applicableCategories = warranty.applicableCategories?.map((c: any) => c._id || c) || [];
    
    // Convert warranty to product plans structure
    const productPlans = applicableProducts.length > 0
      ? applicableProducts.map((productId: string) => {
          const product = products.find(p => p._id === productId);
          return {
            productId,
            productName: product?.productName || 'Unknown Product',
            plans: [{
              name: warranty.name,
              description: warranty.description || '',
              duration: warranty.duration.toString(),
              price: warranty.price.toString(),
              coverage: warranty.coverage && warranty.coverage.length > 0 ? warranty.coverage : [''],
              termsAndConditions: warranty.termsAndConditions || '',
              isActive: warranty.isActive
            }]
          };
        })
      : [];
    
    setEditingWarranty(warranty);
    setFormData({
      applicableCategories,
      productPlans
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      applicableCategories: [],
      productPlans: []
    });
    setSelectedProducts([]);
    setErrors({});
    setEditingWarranty(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Helper functions for product plans
  const addProductToPlans = (productId: string, productName: string) => {
    if (formData.productPlans.find(p => p.productId === productId)) {
      toast.error('Product already added');
      return;
    }
    setFormData(prev => ({
      ...prev,
      productPlans: [...prev.productPlans, {
        productId,
        productName,
        plans: [{
          name: '',
          description: '',
          duration: '',
          price: '',
          coverage: [''],
          termsAndConditions: '',
          isActive: true
        }]
      }]
    }));
  };

  const removeProductFromPlans = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      productPlans: prev.productPlans.filter(p => p.productId !== productId)
    }));
  };

  const addPlanToProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      productPlans: prev.productPlans.map(p => 
        p.productId === productId
          ? {
              ...p,
              plans: [...p.plans, {
                name: '',
                description: '',
                duration: '',
                price: '',
                coverage: [''],
                termsAndConditions: '',
                isActive: true
              }]
            }
          : p
      )
    }));
  };

  const removePlanFromProduct = (productId: string, planIndex: number) => {
    setFormData(prev => ({
      ...prev,
      productPlans: prev.productPlans.map(p => 
        p.productId === productId
          ? {
              ...p,
              plans: p.plans.filter((_, i) => i !== planIndex)
            }
          : p
      )
    }));
  };

  const updateProductPlan = (productId: string, planIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      productPlans: prev.productPlans.map(p => 
        p.productId === productId
          ? {
              ...p,
              plans: p.plans.map((plan, i) => 
                i === planIndex ? { ...plan, [field]: value } : plan
              )
            }
          : p
      )
    }));
  };

  const handleCoverageChange = (productId: string, planIndex: number, coverageIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      productPlans: prev.productPlans.map(p => 
        p.productId === productId
          ? {
              ...p,
              plans: p.plans.map((plan, i) => 
                i === planIndex
                  ? {
                      ...plan,
                      coverage: plan.coverage.map((c, ci) => ci === coverageIndex ? value : c)
                    }
                  : plan
              )
            }
          : p
      )
    }));
  };

  const addCoverageItem = (productId: string, planIndex: number) => {
    setFormData(prev => ({
      ...prev,
      productPlans: prev.productPlans.map(p => 
        p.productId === productId
          ? {
              ...p,
              plans: p.plans.map((plan, i) => 
                i === planIndex
                  ? { ...plan, coverage: [...plan.coverage, ''] }
                  : plan
              )
            }
          : p
      )
    }));
  };

  const removeCoverageItem = (productId: string, planIndex: number, coverageIndex: number) => {
    setFormData(prev => ({
      ...prev,
      productPlans: prev.productPlans.map(p => 
        p.productId === productId
          ? {
              ...p,
              plans: p.plans.map((plan, i) => 
                i === planIndex
                  ? {
                      ...plan,
                      coverage: plan.coverage.filter((_, ci) => ci !== coverageIndex)
                    }
                  : plan
              )
            }
          : p
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (formData.applicableCategories.length === 0) {
      newErrors.applicableCategories = 'At least one category is required';
    }
    
    if (formData.productPlans.length === 0) {
      newErrors.productPlans = 'At least one product with warranty plan is required';
    }
    
    // Validate each product plan
    formData.productPlans.forEach((productPlan, productIndex) => {
      productPlan.plans.forEach((plan, planIndex) => {
        if (!plan.name.trim()) {
          newErrors[`product_${productIndex}_plan_${planIndex}_name`] = 'Warranty name is required';
        }
        if (!plan.duration) {
          newErrors[`product_${productIndex}_plan_${planIndex}_duration`] = 'Duration is required';
        } else if (parseInt(plan.duration) < 1) {
          newErrors[`product_${productIndex}_plan_${planIndex}_duration`] = 'Duration must be at least 1 month';
        }
        if (!plan.price) {
          newErrors[`product_${productIndex}_plan_${planIndex}_price`] = 'Price is required';
        } else if (parseFloat(plan.price) < 0) {
          newErrors[`product_${productIndex}_plan_${planIndex}_price`] = 'Price cannot be negative';
        }
        const validCoverage = plan.coverage.filter(c => c.trim());
        if (validCoverage.length === 0) {
          newErrors[`product_${productIndex}_plan_${planIndex}_coverage`] = 'At least one coverage item is required';
        }
      });
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      // Create warranties for each product plan
      const promises = formData.productPlans.flatMap(productPlan => 
        productPlan.plans.map(plan => {
          const validCoverage = plan.coverage.filter(c => c.trim());
          const payload = {
            name: plan.name.trim(),
            description: plan.description.trim(),
            duration: parseInt(plan.duration),
            price: parseFloat(plan.price),
            coverage: validCoverage,
            termsAndConditions: plan.termsAndConditions.trim(),
            isActive: plan.isActive,
            applicableProducts: [productPlan.productId],
            applicableCategories: formData.applicableCategories
          };
          
          return apiCall('/admin/warranty', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
        })
      );
      
      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.data.success);
      
      if (failed.length === 0) {
        toast.success(`Successfully created ${results.length} warranty plan(s)!`);
        fetchWarranties();
        resetForm();
        setShowAddModal(false);
      } else {
        toast.error(`Failed to create ${failed.length} warranty plan(s)`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save warranties');
    }
  };

  // Get unique durations from warranties for dynamic filter options
  const uniqueDurations = Array.from(new Set(warranties.map(w => w.duration)))
    .sort((a, b) => a - b)
    .filter(d => d > 0);

  const filteredWarranties = warranties.filter(warranty => {
    const searchLower = searchQuery.toLowerCase();
    const matchesName = warranty.name.toLowerCase().includes(searchLower);
    const matchesDescription = warranty.description.toLowerCase().includes(searchLower);
    
    // Check if search matches any product name
    const matchesProduct = warranty.applicableProducts && warranty.applicableProducts.some((product: any) => {
      const productName = typeof product === 'object' && product.productName 
        ? product.productName 
        : typeof product === 'string' 
          ? product 
          : '';
      return productName.toLowerCase().includes(searchLower);
    });
    
    // Check duration filter
    const matchesDuration = durationFilter === '' || warranty.duration.toString() === durationFilter;
    
    return (matchesName || matchesDescription || matchesProduct) && matchesDuration;
  });

  const totalPages = Math.ceil(filteredWarranties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWarranties = filteredWarranties.slice(startIndex, startIndex + itemsPerPage);

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
        <Breadcrumbs items={[{ label: 'Warranty', href: '/warranty' }]} />
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Warranty Plans</h1>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Warranty</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search warranties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field w-full pl-10"
              />
            </div>
            
            {/* Duration Filter */}
            <div className="sm:w-48">
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="input-field w-full"
              >
                <option value="">All Durations</option>
                {uniqueDurations.map(duration => (
                  <option key={duration} value={duration.toString()}>
                    {duration} {duration === 1 ? 'month' : 'months'}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Clear Filters Button */}
            {(searchQuery || durationFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDurationFilter('');
                }}
                className="btn-secondary whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Warranties Table */}
        {loading ? (
          <div className="card animate-pulse p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ) : paginatedWarranties.length === 0 ? (
          <div className="card text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No warranties found</p>
          </div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedWarranties.map((warranty) => (
                      <tr key={warranty._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {warranty.applicableProducts && warranty.applicableProducts.length > 0 ? (
                              <div className="space-y-1">
                                {warranty.applicableProducts.map((product: any, index: number) => (
                                  <div key={product._id || index} className="text-sm text-gray-900">
                                    {typeof product === 'object' && product.productName 
                                      ? product.productName 
                                      : typeof product === 'string' 
                                        ? product 
                                        : 'Unknown Product'}
                                  </div>
                                ))}
                                {warranty.applicableProducts.length > 1 && (
                                  <div className="text-xs text-gray-500">
                                    +{warranty.applicableProducts.length - 1} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{warranty.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate">{warranty.description || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{warranty.duration} months</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">₹{Math.round(warranty.price).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {warranty.coverage && warranty.coverage.length > 0 ? (
                              <>
                                {warranty.coverage.slice(0, 1).map((item, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                    {item}
                                  </span>
                                ))}
                                {warranty.coverage.length > 1 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                    +{warranty.coverage.length - 1}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{warranty.usageCount !== undefined ? warranty.usageCount : '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{warranty.totalRevenue !== undefined ? `₹${Math.round(warranty.totalRevenue).toLocaleString()}` : '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded ${warranty.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {warranty.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/warranty/${warranty._id}/analytics`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Analytics"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleEdit(warranty)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(warranty._id, warranty.name)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

                {/* Pagination */}
              {filteredWarranties.length > 0 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredWarranties.length)} of {filteredWarranties.length} results
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
            )}
            </div>

          
       
          </>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-lg max-w-2xl w-full transition-all duration-300 ${
              showCategoryDropdown ? 'h-auto' : 'max-h-[90vh]'
            } ${showCategoryDropdown ? '' : 'overflow-y-auto'}`}>
              <div className={`${showCategoryDropdown ? 'px-6 pt-6 pb-0' : 'p-6'}`}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    {editingWarranty ? 'Edit Warranty' : 'Add Warranty'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                      setShowCategoryDropdown(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className={showCategoryDropdown ? 'space-y-4 mb-0 pb-0' : 'space-y-4'}>
                  {/* Applicable Categories - First Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Applicable Categories *
                    </label>
                    <div className="relative category-dropdown-container">
                      <div
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        className="input-field w-full cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-gray-500">
                          {formData.applicableCategories.length > 0
                            ? `${formData.applicableCategories.length} category selected`
                            : 'Select categories...'}
                        </span>
                        <Search className="w-4 h-4 text-gray-400" />
                      </div>
                      
                      {showCategoryDropdown && (
                        <div className="relative z-10 w-full mt-1 mb-0 bg-white border border-gray-300 rounded-lg shadow-lg max-h-[400px] overflow-y-auto">
                          <div className="p-2 border-b">
                            <input
                              type="text"
                              placeholder="Search categories..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              className="input-field w-full text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="p-2">
                            {categories.length === 0 ? (
                              <p className="text-sm text-gray-500 p-2">Loading categories...</p>
                            ) : (
                              <div className="space-y-1">
                                {categories
                                  .filter(cat => 
                                    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                                  )
                                  .map((category) => (
                                    <label
                                      key={category._id}
                                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={formData.applicableCategories.includes(category._id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setFormData(prev => ({
                                              ...prev,
                                              applicableCategories: [...prev.applicableCategories, category._id]
                                            }));
                                          } else {
                                            setFormData(prev => ({
                                              ...prev,
                                              applicableCategories: prev.applicableCategories.filter(id => id !== category._id)
                                            }));
                                          }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                      />
                                      <span className="text-sm text-gray-700">{category.name}</span>
                                    </label>
                                  ))}
                                {categories.filter(cat => 
                                  cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                                ).length === 0 && (
                                  <p className="text-sm text-gray-500 p-2">No categories found</p>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Buttons below dropdown */}
                          <div className="flex justify-end space-x-3 p-3 border-t bg-gray-50 rounded-b-lg">
                            <button
                              type="button"
                              onClick={() => {
                                setShowCategoryDropdown(false);
                                setShowAddModal(false);
                                resetForm();
                              }}
                              className="btn-secondary"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowCategoryDropdown(false)}
                              className="btn-primary"
                            >
                              Select Category
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {formData.applicableCategories.length > 0 && !showCategoryDropdown && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.applicableCategories.map((catId) => {
                          const category = categories.find(c => c._id === catId);
                          return category ? (
                            <span
                              key={catId}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {category.name}
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    applicableCategories: prev.applicableCategories.filter(id => id !== catId)
                                  }));
                                }}
                                className="hover:text-blue-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                    {errors.applicableCategories && <p className="text-xs text-red-600 mt-1">{errors.applicableCategories}</p>}
                  </div>

                  {/* Products and Plans Section */}
                  {formData.applicableCategories.length > 0 && !showCategoryDropdown && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Products & Warranty Plans *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search products..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="input-field w-64 text-sm"
                          />
                        </div>
                      </div>
                      
                      {/* Filter products by selected categories */}
                      {(() => {
                        const filteredProducts = products.filter(product => {
                          if (formData.applicableCategories.length === 0) return false;
                          const productCategory = product.category?._id || product.category;
                          return formData.applicableCategories.includes(productCategory);
                        }).filter(product => 
                          product.productName?.toLowerCase().includes(productSearch.toLowerCase())
                        );

                        return (
                          <div className="space-y-4">
                            {/* Add Product Button */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    const product = products.find(p => p._id === e.target.value);
                                    if (product) {
                                      addProductToPlans(product._id, product.productName);
                                    }
                                    e.target.value = '';
                                  }
                                }}
                                className="input-field w-full"
                                value=""
                              >
                                <option value="">Select a product to add warranty plans...</option>
                                {filteredProducts
                                  .filter(p => !formData.productPlans.find(pp => pp.productId === p._id))
                                  .map(product => (
                                    <option key={product._id} value={product._id}>
                                      {product.productName}
                                    </option>
                                  ))}
                              </select>
                            </div>

                            {/* Product Plans */}
                            {formData.productPlans.map((productPlan, productIndex) => (
                              <div key={productPlan.productId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between items-center mb-4">
                                  <h3 className="font-semibold text-gray-900">{productPlan.productName}</h3>
                                  <button
                                    type="button"
                                    onClick={() => removeProductFromPlans(productPlan.productId)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>

                                {/* Plans for this product */}
                                {productPlan.plans.map((plan, planIndex) => (
                                  <div key={planIndex} className="mb-4 p-4 bg-white rounded border border-gray-200">
                                    <div className="flex justify-between items-center mb-3">
                                      <h4 className="text-sm font-medium text-gray-700">Plan {planIndex + 1}</h4>
                                      {productPlan.plans.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removePlanFromProduct(productPlan.productId, planIndex)}
                                          className="text-red-600 hover:text-red-700 text-sm"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>

                                    <div className="space-y-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Warranty Name *
                                        </label>
                                        <input
                                          type="text"
                                          value={plan.name}
                                          onChange={(e) => updateProductPlan(productPlan.productId, planIndex, 'name', e.target.value)}
                                          className="input-field w-full text-sm"
                                          placeholder="e.g., 1 Year Extended Warranty"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Description
                                        </label>
                                        <textarea
                                          value={plan.description}
                                          onChange={(e) => updateProductPlan(productPlan.productId, planIndex, 'description', e.target.value)}
                                          rows={2}
                                          className="input-field w-full text-sm"
                                          placeholder="Warranty description..."
                                        />
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Duration (Months) *
                                          </label>
                                          <input
                                            type="number"
                                            value={plan.duration}
                                            onChange={(e) => updateProductPlan(productPlan.productId, planIndex, 'duration', e.target.value)}
                                            min="1"
                                            className="input-field w-full text-sm"
                                            placeholder="12"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Price (₹) *
                                          </label>
                                          <input
                                            type="number"
                                            value={plan.price}
                                            onChange={(e) => updateProductPlan(productPlan.productId, planIndex, 'price', e.target.value)}
                                            min="0"
                                            step="0.01"
                                            className="input-field w-full text-sm"
                                            placeholder="999"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Coverage *
                                        </label>
                                        {plan.coverage.map((item, coverageIndex) => (
                                          <div key={coverageIndex} className="flex space-x-2 mb-2">
                                            <input
                                              type="text"
                                              value={item}
                                              onChange={(e) => handleCoverageChange(productPlan.productId, planIndex, coverageIndex, e.target.value)}
                                              className="input-field flex-1 text-sm"
                                              placeholder="e.g., Screen Damage, Battery Replacement"
                                            />
                                            {plan.coverage.length > 1 && (
                                              <button
                                                type="button"
                                                onClick={() => removeCoverageItem(productPlan.productId, planIndex, coverageIndex)}
                                                className="btn-secondary px-2 text-red-600"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>
                                        ))}
                                        <button
                                          type="button"
                                          onClick={() => addCoverageItem(productPlan.productId, planIndex)}
                                          className="btn-secondary text-xs mt-1"
                                        >
                                          <Plus className="w-3 h-3 inline mr-1" />
                                          Add Coverage
                                        </button>
                                      </div>

                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Terms & Conditions
                                        </label>
                                        <textarea
                                          value={plan.termsAndConditions}
                                          onChange={(e) => updateProductPlan(productPlan.productId, planIndex, 'termsAndConditions', e.target.value)}
                                          rows={2}
                                          className="input-field w-full text-sm"
                                          placeholder="Warranty terms and conditions..."
                                        />
                                      </div>

                                    </div>
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => addPlanToProduct(productPlan.productId)}
                                  className="btn-secondary text-sm w-full mt-2"
                                >
                                  <Plus className="w-4 h-4 inline mr-1" />
                                  Add Another Plan
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {!showCategoryDropdown && (
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddModal(false);
                          resetForm();
                          setShowCategoryDropdown(false);
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      {formData.applicableCategories.length > 0 && formData.productPlans.length > 0 ? (
                        <button type="submit" className="btn-primary">
                          {editingWarranty ? 'Update' : 'Create'} Warranty
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowCategoryDropdown(true)}
                          className="btn-primary"
                        >
                          Select Category
                        </button>
                      )}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          title="Delete Warranty"
          message={`Are you sure you want to delete "${deleteDialog.warrantyName}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onClose={handleDeleteCancel}
        />
      </div>
    </DashboardLayout>
  );
}

