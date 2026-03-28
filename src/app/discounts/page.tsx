'use client'

import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import React, { useState, useEffect, useRef } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import { getFormDataHeaders } from '@/lib/config';
import { CouponCardSkeleton } from '@/components/Skeleton';
import { useApiWithLoading } from '@/lib/apiUtils';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Coupon {
  _id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumAmount: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  image?: string;
  isFlashSale: boolean;
  flashSaleStart?: string;
  flashSaleEnd?: string;
  applicableCategories?: any[];
  applicableProducts?: any[];
  isFirstTimeUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DiscountsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    couponId: string | null;
    couponCode: string;
  }>({
    isOpen: false,
    couponId: null,
    couponCode: ''
  });

  // Use the new API hook for managing API calls
  const { fetchData, loading, resetLoading } = useApiWithLoading();

  // Helper function to get value placeholder based on type
  const getValuePlaceholder = (type: string) => {
    return type === 'percentage' ? 'Enter percentage (0-100)' : 'Enter amount in ₹';
  };

  // Helper function to format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };
  const [form, setForm] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: '',
    minimumAmount: '',
    maximumDiscount: '',
    usageLimit: '',
    image: '',
    flashSaleStart: '',
    flashSaleEnd: '',
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: '',
    minimumAmount: '',
    maximumDiscount: '',
    usageLimit: '',
    image: '',
    isActive: true,
    flashSaleStart: '',
    flashSaleEnd: '',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Function to load coupons
  const loadCoupons = async () => {
    try {
      const data = await fetchData<any>(
        getApiUrl('/web/coupons'),
        { headers: getAuthHeaders() }
      );
      setCoupons(data.data || []);
    } catch (error) {
      toast.error('Failed to load coupons');
    }
  };

  // Fetch coupons from API
  useEffect(() => {
    // Only fetch if loading is true
    if (loading) {
      loadCoupons();
    }
  }, [loading, fetchData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If type is changing, reset the value field
    if (name === 'type') {
      setForm(prev => ({ ...prev, [name]: value, value: '' }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle image file selection and preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setForm(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate percentage value
    if (form.type === 'percentage' && Number(form.value) > 100) {
      toast.error('Percentage value cannot exceed 100%');
      return;
    }
    
    // Validate coupon value against minimum amount
    const couponValue = Number(form.value);
    const minimumAmount = Number(form.minimumAmount) || 0;
    
    if (form.type === 'fixed' && couponValue > minimumAmount) {
      toast.error('Coupon value cannot be greater than minimum amount');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select an image');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('code', form.code);
      formData.append('description', form.description);
      formData.append('type', form.type);
      formData.append('value', form.value);
      formData.append('minimumAmount', form.minimumAmount || '0');
      if (form.maximumDiscount) formData.append('maximumDiscount', form.maximumDiscount);
      if (form.usageLimit) formData.append('usageLimit', form.usageLimit);
      if (form.flashSaleStart) formData.append('flashSaleStart', form.flashSaleStart);
      if (form.flashSaleEnd) formData.append('flashSaleEnd', form.flashSaleEnd);
      formData.append('isFlashSale', (!!(form.flashSaleStart && form.flashSaleEnd)).toString());
      
      // Add image if selected
      if (selectedFile) {
        formData.append('image', selectedFile);
      }
      
      const response = await fetch(getApiUrl('/web/coupons'), {
        method: 'POST',
        headers: getFormDataHeaders(),
        body: formData
      });

      if (response.ok) {
        toast.success('Coupon added successfully!');
        setForm({ code: '', description: '', type: 'percentage', value: '', minimumAmount: '', maximumDiscount: '', usageLimit: '', image: '', flashSaleStart: '', flashSaleEnd: '' });
        setImagePreview(''); // Remove preview after submit
        setSelectedFile(null); // Unselect file after submit
        resetLoading(); // Reset loading state after successful add
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add coupon');
      }
    } catch (error) {
      toast.error('Failed to add coupon');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    
    // Format dates for date input fields (YYYY-MM-DD format)
    const formatDateForInput = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };
    
    setFormData({
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value.toString(),
      minimumAmount: coupon.minimumAmount.toString(),
      maximumDiscount: coupon.maximumDiscount?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      image: coupon.image || '',
      isActive: coupon.isActive,
      flashSaleStart: formatDateForInput(coupon.flashSaleStart || ''),
      flashSaleEnd: formatDateForInput(coupon.flashSaleEnd || ''),
    });
    // Reset file input and selected file when editing
    setSelectedFile(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    setShowAddModal(true);
  };

  const handleDeleteClick = (id: string, couponCode: string) => {
    setDeleteDialog({
      isOpen: true,
      couponId: id,
      couponCode
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.couponId) return;
    
    try {
      const response = await fetch(getApiUrl(`/web/coupons/${deleteDialog.couponId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success('Coupon deleted successfully!');
        resetLoading(); // Reset loading state after successful delete
      } else {
        toast.error('Failed to delete coupon');
      }
    } catch (error) {
      toast.error('Failed to delete coupon');
    } finally {
      setDeleteDialog({
        isOpen: false,
        couponId: null,
        couponCode: ''
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      couponId: null,
      couponCode: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate percentage value
    if (formData.type === 'percentage' && Number(formData.value) > 100) {
      toast.error('Percentage value cannot exceed 100%');
      return;
    }
    
    // Validate coupon value against minimum amount
    const couponValue = Number(formData.value);
    const minimumAmount = Number(formData.minimumAmount) || 0;
    
    if (formData.type === 'fixed' && couponValue > minimumAmount) {
      toast.error('Coupon value cannot be greater than minimum amount');
      return;
    }
    
    try {
      const url = editingCoupon 
        ? getApiUrl(`/web/coupons/${editingCoupon._id}`)
        : getApiUrl('/web/coupons');
      
      const method = editingCoupon ? 'PUT' : 'POST';
      
      const formDataToSend = new FormData();
      formDataToSend.append('code', formData.code);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('value', formData.value);
      formDataToSend.append('minimumAmount', formData.minimumAmount || '0');
      if (formData.maximumDiscount) formDataToSend.append('maximumDiscount', formData.maximumDiscount);
      if (formData.usageLimit) formDataToSend.append('usageLimit', formData.usageLimit);
      formDataToSend.append('isActive', formData.isActive.toString());
      if (formData.flashSaleStart) formDataToSend.append('flashSaleStart', formData.flashSaleStart);
      if (formData.flashSaleEnd) formDataToSend.append('flashSaleEnd', formData.flashSaleEnd);
      formDataToSend.append('isFlashSale', (!!(formData.flashSaleStart && formData.flashSaleEnd)).toString());
      
      // Add image if selected (use ref or selectedFile state)
      if (selectedFile) {
        console.log('Adding image from selectedFile:', selectedFile.name);
        formDataToSend.append('image', selectedFile);
      } else if (imageInputRef.current && imageInputRef.current.files && imageInputRef.current.files[0]) {
        console.log('Adding image from file input:', imageInputRef.current.files[0].name);
        formDataToSend.append('image', imageInputRef.current.files[0]);
      } else {
        console.log('No image file selected for update');
      }
      
      const response = await fetch(url, {
        method,
        headers: getFormDataHeaders(),
        body: formDataToSend
      });

      if (response.ok) {
        toast.success(editingCoupon ? 'Coupon updated successfully!' : 'Coupon added successfully!');
        setShowAddModal(false);
        setEditingCoupon(null);
        setFormData({ code: '', description: '', type: 'percentage', value: '', minimumAmount: '', maximumDiscount: '', usageLimit: '', image: '', isActive: true, flashSaleStart: '', flashSaleEnd: '' });
        setSelectedFile(null);
        if (imageInputRef.current) {
          imageInputRef.current.value = '';
        }
        resetLoading(); // Reset loading state after successful save
        // Reload coupons list
        await loadCoupons();
      } else {
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          toast.error(error.message || 'Failed to save coupon');
        } else {
          const errorText = await response.text();
          toast.error('Failed to save coupon. Please try again.');
        }
      }
    } catch (error) {
      toast.error('Failed to save coupon');
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto py-0">
        <Breadcrumbs items={[{ label: 'Discounts & Coupons' }]} />
        <h1 className="text-2xl font-bold mb-6">Coupon Details</h1>
        <div>
        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingCoupon ? 'Edit Coupon' : 'Add Coupon'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      className="input-field"
                      placeholder="Enter coupon code"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coupon Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={e => {
                        const newType = e.target.value;
                        setFormData(prev => ({ 
                          ...prev, 
                          type: newType, 
                          value: '' // Reset value when type changes
                        }));
                      }}
                      className="input-field"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coupon Value *
                    </label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      className={`input-field ${
                        (formData.type === 'percentage' && Number(formData.value) > 100) ||
                        (formData.type === 'fixed' && Number(formData.value) > Number(formData.minimumAmount))
                          ? 'border-red-500' 
                          : ''
                      }`}
                      placeholder={getValuePlaceholder(formData.type)}
                      min={formData.type === 'percentage' ? 0 : 0}
                      max={formData.type === 'percentage' ? 100 : Number(formData.minimumAmount) || undefined}
                      required
                    />
                    {formData.type === 'percentage' && Number(formData.value) > 100 && (
                      <p className="text-red-500 text-xs mt-1">Percentage cannot exceed 100%</p>
                    )}
                    {formData.type === 'fixed' && Number(formData.value) > Number(formData.minimumAmount) && (
                      <p className="text-red-500 text-xs mt-1">Coupon value cannot exceed minimum amount</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Amount *
                    </label>
                    <input
                      type="number"
                      value={formData.minimumAmount}
                      onChange={e => setFormData(prev => ({ ...prev, minimumAmount: e.target.value }))}
                      className="input-field"
                      placeholder="Minimum order amount"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      value={formData.isActive ? 'active' : 'inactive'}
                      onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                      className="input-field"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="input-field"
                      placeholder="Enter coupon description"
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Flash Sale Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.flashSaleStart}
                        onChange={e => {
                          const newStartDate = e.target.value;
                          setFormData(prev => {
                            // If end date is before new start date, clear it
                            const updatedData = { ...prev, flashSaleStart: newStartDate };
                            if (prev.flashSaleEnd && prev.flashSaleEnd < newStartDate) {
                              updatedData.flashSaleEnd = '';
                            }
                            return updatedData;
                          });
                        }}
                        min={getTodayDate()}
                        className="input-field"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Flash Sale End Date
                      </label>
                      <input
                        type="date"
                        value={formData.flashSaleEnd}
                        onChange={e => setFormData(prev => ({ ...prev, flashSaleEnd: e.target.value }))}
                        min={formData.flashSaleStart || getTodayDate()}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image
                    </label>
                    <input
                      ref={imageInputRef}
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files && e.target.files[0];
                        if (file) {
                          setSelectedFile(file);
                          setFormData(prev => ({ ...prev, image: URL.createObjectURL(file) }));
                        }
                      }}
                      className="input-field"
                    />
                    {formData.image && (
                      <img src={formData.image} alt="Coupon Preview" className="w-32 h-20 object-cover rounded mt-2 border" />
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    {editingCoupon ? 'Update Coupon' : 'Add Coupon'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingCoupon(null);
                      setFormData({ code: '', description: '', type: 'percentage', value: '', minimumAmount: '', maximumDiscount: '', usageLimit: '', image: '', isActive: true, flashSaleStart: '', flashSaleEnd: '' });
                      setSelectedFile(null);
                      if (imageInputRef.current) {
                        imageInputRef.current.value = '';
                      }
                    }}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Add Coupon Form */}
        <form onSubmit={handleAddCoupon} className="mb-8 p-4 border rounded bg-white flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium mb-1">Coupon Code</label>
              <input type="text" name="code" value={form.code} onChange={handleInputChange} className="input-field w-full" required />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium mb-1">Coupon Type</label>
              <select name="type" value={form.type} onChange={handleInputChange} className="input-field w-full">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium mb-1">Coupon Value</label>
              <input 
                type="number" 
                name="value" 
                value={form.value} 
                onChange={handleInputChange} 
                className={`input-field w-full ${
                  (form.type === 'percentage' && Number(form.value) > 100) ||
                  (form.type === 'fixed' && Number(form.value) > Number(form.minimumAmount))
                    ? 'border-red-500' 
                    : ''
                }`}
                placeholder={getValuePlaceholder(form.type)}
                min={form.type === 'percentage' ? 0 : 0}
                max={form.type === 'percentage' ? 100 : Number(form.minimumAmount) || undefined}
                required 
              />
              {form.type === 'percentage' && Number(form.value) > 100 && (
                <p className="text-red-500 text-xs mt-1">Percentage cannot exceed 100%</p>
              )}
              {form.type === 'fixed' && Number(form.value) > Number(form.minimumAmount) && (
                <p className="text-red-500 text-xs mt-1">Coupon value cannot exceed minimum amount</p>
              )}
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium mb-1">Minimum Amount</label>
              <input type="number" name="minimumAmount" value={form.minimumAmount} onChange={handleInputChange} className="input-field w-full" required />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium mb-1">Coupon Image</label>
              <input type="file" name="image" accept="image/*" onChange={handleImageChange} className="input-field w-full" required />
              {imagePreview && (
                <div className="mt-2">
                  <label className="block text-xs text-gray-500 mb-1">Preview</label>
                  <img src={imagePreview} alt="Preview" className="w-32 h-20 object-cover rounded border" />
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleInputChange} className="input-field w-full" rows={2} required />
          </div>
          {/* Flash Sale Scheduler */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium mb-1">Flash Sale Start Date</label>
              <input 
                type="date" 
                name="flashSaleStart" 
                value={form.flashSaleStart} 
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  setForm(prev => {
                    // If end date is before new start date, clear it
                    const updatedForm = { ...prev, flashSaleStart: newStartDate };
                    if (prev.flashSaleEnd && prev.flashSaleEnd < newStartDate) {
                      updatedForm.flashSaleEnd = '';
                    }
                    return updatedForm;
                  });
                }}
                min={getTodayDate()}
                className="input-field w-full" 
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium mb-1">Flash Sale End Date</label>
              <input 
                type="date" 
                name="flashSaleEnd" 
                value={form.flashSaleEnd} 
                onChange={handleInputChange} 
                min={form.flashSaleStart || getTodayDate()}
                className="input-field w-full" 
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary px-6">Add Coupon</button>
          </div>
        </form>
        {/* Coupons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <CouponCardSkeleton count={4} />
          ) : coupons.length === 0 ? (
            <div className="col-span-2 text-center py-8">
              <p className="text-gray-600">No coupons found</p>
            </div>
          ) : (
            coupons.map((coupon) => (
              <div key={coupon._id} className="card">
                <div className="relative">
                  <img
                    src={coupon.image || 'https://via.placeholder.com/400x200?text=Coupon'}
                    alt={coupon.code}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Coupon';
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      coupon.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-primary-700">{coupon.code}</span>
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-semibold">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{coupon.description}</p>
                  <div className="text-xs text-gray-500">
                    <p>Min. Amount: ₹{coupon.minimumAmount}</p>
                    {coupon.maximumDiscount && <p>Max. Discount: ₹{coupon.maximumDiscount}</p>}
                    {coupon.usageLimit && <p>Usage: {coupon.usedCount}/{coupon.usageLimit}</p>}
                    {coupon.isFlashSale && coupon.flashSaleStart && coupon.flashSaleEnd && (
                      <div className="mt-1 p-1 bg-orange-50 rounded">
                        <p className="text-orange-700 font-medium">Flash Sale</p>
                        <p>{formatDateForDisplay(coupon.flashSaleStart)} - {formatDateForDisplay(coupon.flashSaleEnd)}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t mt-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="p-1 text-gray-600 hover:text-gray-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(coupon._id, coupon.code)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Coupon"
        message={`Are you sure you want to delete coupon "${deleteDialog.couponCode}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </DashboardLayout>
  );
}
