'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Plus, Search, Eye, Tag, Calendar, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiCall } from '@/lib/config';
import Link from 'next/link';

interface Promo {
  _id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_one_get_one';
  value: number;
  minimumAmount: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  image?: string;
  applicableCategories?: any[];
  applicableProducts?: any[];
  applicableUsers?: any[];
  isFirstTimeUser: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
  totalRevenue?: number;
  totalDiscount?: number;
  isExpired?: boolean;
  isDeleted?: boolean;
}

export default function PromoManagementPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: '',
    minimumAmount: '',
    maximumDiscount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
    isFirstTimeUser: false,
    image: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPromos();
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/admin/promos/stats');
      if (response.data.success) {
        setPromos(response.data.data);
      } else {
        toast.error('Failed to load promos');
      }
    } catch (error) {
      toast.error('Failed to load promos');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (promo: Promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      name: promo.name,
      description: promo.description || '',
      type: promo.type,
      value: promo.value.toString(),
      minimumAmount: promo.minimumAmount.toString(),
      maximumDiscount: promo.maximumDiscount?.toString() || '',
      usageLimit: promo.usageLimit?.toString() || '',
      validFrom: promo.validFrom ? new Date(promo.validFrom).toISOString().split('T')[0] : '',
      validUntil: promo.validUntil ? new Date(promo.validUntil).toISOString().split('T')[0] : '',
      isActive: promo.isActive,
      isFirstTimeUser: promo.isFirstTimeUser,
      image: promo.image || ''
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    const newErrors: Record<string, string> = {};

    // Required field validations
    if (!formData.code.trim()) {
      newErrors.code = 'Promo code is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Promo name is required';
    }

    if (!formData.value.trim()) {
      newErrors.value = 'Promo value is required';
    }

    if (!formData.minimumAmount.trim()) {
      newErrors.minimumAmount = 'Minimum amount is required';
    }

    if (!formData.validFrom) {
      newErrors.validFrom = 'Valid from date is required';
    }

    // Validation: percentage type should be 0-100
    if (formData.type === 'percentage' && formData.value) {
      const value = parseFloat(formData.value);
      if (isNaN(value) || value < 0 || value > 100) {
        newErrors.value = 'Percentage value must be between 0 and 100';
      }
    }

    // Validation: fixed amount should not be negative
    if (formData.type === 'fixed' && formData.value) {
      const value = parseFloat(formData.value);
      if (isNaN(value) || value < 0) {
        newErrors.value = 'Fixed amount cannot be negative';
      }
    }

    // Validation: minimum amount should not be negative
    if (formData.minimumAmount) {
      const minimumAmount = parseFloat(formData.minimumAmount);
      if (isNaN(minimumAmount) || minimumAmount < 0) {
        newErrors.minimumAmount = 'Minimum amount cannot be negative';
      }
    }

    // Validation: maximum discount should not be negative
    if (formData.maximumDiscount) {
      const maxDiscount = parseFloat(formData.maximumDiscount);
      if (isNaN(maxDiscount) || maxDiscount < 0) {
        newErrors.maximumDiscount = 'Maximum discount cannot be negative';
      }
    }

    // Validation: usage limit should not be negative
    if (formData.usageLimit) {
      const usageLimit = parseInt(formData.usageLimit);
      if (isNaN(usageLimit) || usageLimit < 0) {
        newErrors.usageLimit = 'Usage limit cannot be negative';
      }
    }

    // If there are errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors if validation passes
    setErrors({});

    try {
      const promoData = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        value: parseFloat(formData.value),
        minimumAmount: parseFloat(formData.minimumAmount),
        maximumDiscount: formData.maximumDiscount ? parseFloat(formData.maximumDiscount) : undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        validFrom: formData.validFrom ? new Date(formData.validFrom) : new Date(),
        validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
        isActive: formData.isActive,
        isFirstTimeUser: formData.isFirstTimeUser
      };

      if (editingPromo) {
        const response = await apiCall(`/admin/promos/${editingPromo._id}`, {
          method: 'PUT',
          body: JSON.stringify(promoData)
        });

        if (response.data.success) {
          toast.success('Promo updated successfully!');
          setShowAddModal(false);
          setEditingPromo(null);
          resetForm();
          fetchPromos();
        } else {
          toast.error('Failed to update promo');
        }
      } else {
        const response = await apiCall('/admin/promos', {
          method: 'POST',
          body: JSON.stringify(promoData)
        });

        if (response.data.success) {
          toast.success('Promo created successfully!');
          setShowAddModal(false);
          resetForm();
          fetchPromos();
        } else {
          toast.error('Failed to create promo');
        }
      }
    } catch (error) {
      toast.error('Failed to save promo');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: '',
      minimumAmount: '',
      maximumDiscount: '',
      usageLimit: '',
      validFrom: '',
      validUntil: '',
      isActive: true,
      isFirstTimeUser: false,
      image: ''
    });
    setErrors({});
    setSelectedFile(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const filteredPromos = promos.filter(promo =>
    promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    promo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    promo.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalItems = filteredPromos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPromos = filteredPromos.slice(startIndex, endIndex);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumbs items={[{ label: 'Promo Management' }]} />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Promo Management</h1>
          <p className="text-gray-600 mt-2">View and manage promotional codes</p>
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingPromo ? 'Edit Promo' : 'Add Promo'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Promo Code *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => {
                        setFormData({ ...formData, code: e.target.value });
                        if (errors.code) {
                          setErrors({ ...errors, code: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                        errors.code ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="PROMO20"
                    />
                    {errors.code && (
                      <p className="text-xs text-red-600 mt-1">{errors.code}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Promo Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) {
                          setErrors({ ...errors, name: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Summer Sale"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Promo Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        // Reset value when type changes if invalid
                        let newValue = formData.value;
                        if (newType === 'percentage' && formData.value && parseFloat(formData.value) > 100) {
                          newValue = '';
                        }
                        setFormData({ ...formData, type: newType, value: newValue });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                      <option value="free_shipping">Free Shipping</option>
                      <option value="buy_one_get_one">Buy One Get One</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Promo Value *
                    </label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, value });
                        if (errors.value) {
                          setErrors({ ...errors, value: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                        errors.value ||
                        (formData.type === 'percentage' && formData.value && (parseFloat(formData.value) < 0 || parseFloat(formData.value) > 100)) ||
                        (formData.type === 'fixed' && formData.value && parseFloat(formData.value) < 0)
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder={formData.type === 'percentage' ? 'Enter percentage (0-100)' : 'Enter amount in ₹'}
                      min={formData.type === 'percentage' ? 0 : 0}
                      max={formData.type === 'percentage' ? 100 : undefined}
                      step={formData.type === 'percentage' ? 0.01 : 1}
                    />
                    {errors.value && (
                      <p className="text-xs text-red-600 mt-1">{errors.value}</p>
                    )}
                    {!errors.value && formData.type === 'percentage' && formData.value && parseFloat(formData.value) > 100 && (
                      <p className="text-xs text-red-600 mt-1">Percentage cannot exceed 100%</p>
                    )}
                    {!errors.value && formData.type === 'percentage' && formData.value && parseFloat(formData.value) < 0 && (
                      <p className="text-xs text-red-600 mt-1">Percentage cannot be negative</p>
                    )}
                    {!errors.value && formData.type === 'fixed' && formData.value && parseFloat(formData.value) < 0 && (
                      <p className="text-xs text-red-600 mt-1">Fixed amount cannot be negative</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Amount *
                    </label>
                    <input
                      type="number"
                      value={formData.minimumAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, minimumAmount: value });
                        if (errors.minimumAmount) {
                          setErrors({ ...errors, minimumAmount: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                        errors.minimumAmount ||
                        (formData.minimumAmount && parseFloat(formData.minimumAmount) < 0)
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      min="0"
                      step="0.01"
                    />
                    {errors.minimumAmount && (
                      <p className="text-xs text-red-600 mt-1">{errors.minimumAmount}</p>
                    )}
                    {!errors.minimumAmount && formData.minimumAmount && parseFloat(formData.minimumAmount) < 0 && (
                      <p className="text-xs text-red-600 mt-1">Minimum amount cannot be negative</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Discount
                    </label>
                    <input
                      type="number"
                      value={formData.maximumDiscount}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, maximumDiscount: value });
                        if (errors.maximumDiscount) {
                          setErrors({ ...errors, maximumDiscount: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                        errors.maximumDiscount ||
                        (formData.maximumDiscount && parseFloat(formData.maximumDiscount) < 0)
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      min="0"
                      step="0.01"
                    />
                    {errors.maximumDiscount && (
                      <p className="text-xs text-red-600 mt-1">{errors.maximumDiscount}</p>
                    )}
                    {!errors.maximumDiscount && formData.maximumDiscount && parseFloat(formData.maximumDiscount) < 0 && (
                      <p className="text-xs text-red-600 mt-1">Maximum discount cannot be negative</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, usageLimit: value });
                        if (errors.usageLimit) {
                          setErrors({ ...errors, usageLimit: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                        errors.usageLimit ||
                        (formData.usageLimit && parseInt(formData.usageLimit) < 0)
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      min="0"
                      step="1"
                    />
                    {errors.usageLimit && (
                      <p className="text-xs text-red-600 mt-1">{errors.usageLimit}</p>
                    )}
                    {!errors.usageLimit && formData.usageLimit && parseInt(formData.usageLimit) < 0 && (
                      <p className="text-xs text-red-600 mt-1">Usage limit cannot be negative</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid From *
                    </label>
                    <input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => {
                        setFormData({ ...formData, validFrom: e.target.value });
                        if (errors.validFrom) {
                          setErrors({ ...errors, validFrom: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                        errors.validFrom ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min={getTodayDate()}
                    />
                    {errors.validFrom && (
                      <p className="text-xs text-red-600 mt-1">{errors.validFrom}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid Until
                    </label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      min={formData.validFrom || getTodayDate()}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isFirstTimeUser}
                      onChange={(e) => setFormData({ ...formData, isFirstTimeUser: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">First Time User Only</span>
                  </label>
                </div>
                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    {editingPromo ? 'Update Promo' : 'Create Promo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingPromo(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search promos by code, name, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Promos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : totalItems === 0 ? (
            <div className="col-span-3 text-center py-12 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No promos found</p>
            </div>
          ) : (
            paginatedPromos.map((promo) => (
              <div key={promo._id} className="card">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-primary-700">{promo.code}</span>
                    {promo.isDeleted && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{promo.name || promo.code}</h3>
                  
                  {/* Analytics Data - Only show analytics, no badges */}
                  <div className="mt-3 pt-3 border-t space-y-2">
                    {promo.usageCount !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Used:</span>
                        <span className="text-xs font-semibold text-gray-900">{promo.usageCount} times</span>
                      </div>
                    )}
                    {promo.totalRevenue !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Revenue:</span>
                        <span className="text-xs font-semibold text-green-600">₹{promo.totalRevenue.toLocaleString()}</span>
                      </div>
                    )}
                    {promo.totalDiscount !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Discount Given:</span>
                        <span className="text-xs font-semibold text-blue-600">₹{promo.totalDiscount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end pt-3 border-t mt-3">
                  <Link
                    href={`/promos/${promo._id}/analytics`}
                    className="text-primary-600 hover:text-primary-900 flex items-center space-x-1 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Analytics</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalItems > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </DashboardLayout>
  );
}

