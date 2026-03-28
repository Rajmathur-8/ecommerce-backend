'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Calendar, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl, getAuthHeaders, getFormDataHeaders } from '@/lib/config';
import { BannerSkeleton } from '@/components/Skeleton';
import { useApiWithLoading } from '@/lib/apiUtils';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    width: '1920',
    height: '600',
    isActive: true, // Always true, no checkbox needed
    link: '',
    isPreOrder: false,
    preOrderProductId: '',
  });
  const [products, setProducts] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ratioError, setRatioError] = useState<string>('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    bannerId: string | null;
    bannerTitle: string;
  }>({
    isOpen: false,
    bannerId: null,
    bannerTitle: ''
  });

  // Use the new API hook for managing API calls
  const { fetchData, loading, resetLoading } = useApiWithLoading();

  // Fetch banners from API
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const data = await fetchData<any>(
          getApiUrl('/web/banners'),
          { headers: getAuthHeaders() }
        );
        setBanners(data.data || []);
      } catch (error) {
        setBanners([]);
      }
    };

    // Only fetch if loading is true
    if (loading) {
      loadBanners();
    }
  }, [loading, fetchData]);

  // Fetch products when modal opens
  useEffect(() => {
    const loadProducts = async () => {
      if (showAddModal) {
        try {
          const response = await fetch(getApiUrl('/web/products?limit=1000'), {
            headers: getAuthHeaders()
          });
          if (response.ok) {
            const data = await response.json();
            setProducts(data.data || []);
          } else {
            setProducts([]);
          }
        } catch (error) {
          setProducts([]);
        }
      }
    };

    loadProducts();
  }, [showAddModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner && !selectedFile) {
      toast.error('Please select an image');
      return;
    }

    // Check if ratio error exists
    if (ratioError) {
      toast.error('Please upload an image with correct ratio (16:5)');
      return;
    }

    try {
      const url = editingBanner 
        ? getApiUrl(`/web/banners/${editingBanner._id}`)
        : getApiUrl('/web/banners');
      const method = editingBanner ? 'PUT' : 'POST';
      
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('width', formData.width);
      formDataToSend.append('height', formData.height);
      formDataToSend.append('link', formData.link);
      formDataToSend.append('isPreOrder', formData.isPreOrder.toString());
      if (formData.isPreOrder && formData.preOrderProductId) {
        formDataToSend.append('preOrderProductId', formData.preOrderProductId);
      }
      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      }
      formDataToSend.append('isActive', formData.isActive.toString());

      const response = await fetch(url, {
        method,
        headers: getFormDataHeaders(),
        body: formDataToSend,
      });
      if (response.ok) {
        toast.success(editingBanner ? 'Banner updated successfully!' : 'Banner added successfully!');
        setShowAddModal(false);
        setEditingBanner(null);
        setFormData({ title: '', description: '', image: '', width: '1920', height: '600', isActive: true, link: '', isPreOrder: false, preOrderProductId: '' });
        setImagePreview('');
        setSelectedFile(null);
        resetLoading(); // Reset loading state to refresh banners list
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save banner');
      }
    } catch (error) {
      toast.error('Failed to save banner. Please try again.');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRatioError('');
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image: result }));
        
        // Check image dimensions and validate ratio (only for new banners, not when editing)
        const img = new Image();
        img.onload = () => {
          const imageWidth = img.width;
          const imageHeight = img.height;
          const imageRatio = imageWidth / imageHeight;
          const expectedRatio = 16 / 5; // 3.2:1
          const tolerance = 0.1; // Allow 0.1 difference in ratio
          
          if (Math.abs(imageRatio - expectedRatio) > tolerance) {
            const actualRatio = imageRatio.toFixed(2);
            setRatioError(`Image ratio mismatch! Expected 16:5 (3.20:1), but got ${actualRatio}:1. Image dimensions: ${imageWidth}px × ${imageHeight}px`);
            setSelectedFile(null);
            setImagePreview('');
            setFormData(prev => ({ ...prev, image: '' }));
            toast.error(`Image ratio must be 16:5 (3.20:1). Current ratio: ${actualRatio}:1`);
          } else {
            setSelectedFile(file);
            setRatioError('');
            toast.success('Image ratio validated successfully!');
          }
        };
        img.onerror = () => {
          setRatioError('Failed to load image. Please try again.');
          setSelectedFile(null);
          setImagePreview('');
          setFormData(prev => ({ ...prev, image: '' }));
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (banner: any) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      image: banner.image,
      width: banner.width?.toString() || '1920',
      height: banner.height?.toString() || '600',
      isActive: banner.isActive,
      link: banner.link || '',
      isPreOrder: banner.isPreOrder || false,
      preOrderProductId: banner.preOrderProductId?.toString() || '',
    });
    setImagePreview(banner.image);
    setSelectedFile(null);
    setRatioError('');
    setShowAddModal(true);
  };

  const handleDeleteClick = (bannerId: string, bannerTitle: string) => {
    setDeleteDialog({
      isOpen: true,
      bannerId,
      bannerTitle
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.bannerId) return;
    
    try {
      const response = await fetch(getApiUrl(`/web/banners/${deleteDialog.bannerId}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        toast.success('Banner deleted successfully!');
        resetLoading(); // Reset loading state to refresh banners list
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete banner');
      }
    } catch (error) {
      toast.error('Failed to delete banner. Please try again.');
    } finally {
      setDeleteDialog({
        isOpen: false,
        bannerId: null,
        bannerTitle: ''
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      bannerId: null,
      bannerTitle: ''
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Banners' }]} />
        
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Banners</h1>
            <p className="text-gray-600 mt-2">Manage promotional banners</p>
          </div>
          <button
            onClick={() => {
              setEditingBanner(null);
              setFormData({ title: '', description: '', image: '', width: '1920', height: '600', isActive: true, link: '', isPreOrder: false, preOrderProductId: '' });
              setImagePreview('');
              setSelectedFile(null);
              setRatioError('');
              setShowAddModal(true);
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Banner</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Banners</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{banners.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Banners</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {banners.filter(b => b.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Banners Grid */}
        {loading ? (
          <BannerSkeleton count={4} />
        ) : banners.length === 0 ? (
          <div className="flex-1 flex items-center justify-center w-full min-h-[300px]">
            <p className="text-gray-400 text-lg font-medium">No banners found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((banner) => {
              const bannerWidth = banner.width || 1920;
              const bannerHeight = banner.height || 600;
              const aspectRatio = bannerWidth / bannerHeight;
              
              // Calculate display dimensions (max width 500px to fit in card)
              const maxDisplayWidth = 500;
              const displayWidth = Math.min(bannerWidth, maxDisplayWidth);
              const displayHeight = displayWidth / aspectRatio;
              
              return (
                <div key={banner._id} className="card">
                  <div className="relative flex justify-center items-start bg-gray-50 rounded-lg mb-4 overflow-hidden">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="rounded-lg object-contain"
                      style={{
                        width: `${displayWidth}px`,
                        height: `${displayHeight}px`,
                        maxWidth: '100%'
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        banner.isActive 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{banner.title}</h3>
                    {banner.isPreOrder && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        Pre-Order
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{banner.description}</p>
                  {banner.link && (
                    <p className="text-xs text-blue-600 truncate">
                      Link: {banner.link}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Width: {banner.width || 1920}px</span>
                    <span>Height: {banner.height || 600}px</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t mt-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(banner)}
                      className="p-1 text-gray-600 hover:text-gray-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(banner._id, banner.title)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingBanner ? 'Edit Banner' : 'Add Banner'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="input-field"
                    placeholder="Enter banner title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field"
                    placeholder="Enter banner description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Image {!editingBanner && '*'}
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      required={!editingBanner}
                    />
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preview ({formData.width}px × {formData.height}px)
                        </label>
                        <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ maxWidth: '100%' }}>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="rounded-lg"
                            style={{
                              width: `${Math.min(parseInt(formData.width) || 1920, 500)}px`,
                              height: `${Math.min(parseInt(formData.height) || 600, 300)}px`,
                              maxWidth: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Standard dimensions: {formData.width}px × {formData.height}px
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 font-medium mb-1">
                      Fixed Ratio: 16:5 (Width:Height)
                    </p>
                    <p className="text-xs text-blue-700">
                      Standard dimensions: 1920px × 600px (Ratio: 3.20:1)
                    </p>
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      ⚠️ Only images with 16:5 ratio will be accepted.
                    </p>
                  </div>
                  
                  {ratioError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800 font-medium">
                        ⚠️ Ratio Validation Failed
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        {ratioError}
                      </p>
                    </div>
                  )}
                </div>

                {/* Link Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                    className="input-field"
                    placeholder="https://example.com or /products/123"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL to redirect when banner is clicked
                  </p>
                </div>

                {/* Pre-Order Banner */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isPreOrder}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPreOrder: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Pre-Order Banner</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Enable this to create orders automatically when banner is clicked
                  </p>
                  
                  {formData.isPreOrder && (
                    <div className="mt-3 ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Product for Pre-Order *
                      </label>
                      <select
                        value={formData.preOrderProductId}
                        onChange={(e) => setFormData(prev => ({ ...prev, preOrderProductId: e.target.value }))}
                        className="input-field"
                        required={formData.isPreOrder}
                      >
                        <option value="">Select a product</option>
                        {products
                          .filter(product => product.isPreOrder)
                          .map((product) => (
                            <option key={product._id} value={product._id}>
                              {product.productName} - ₹{product.price} {product.isPreOrder && '(Pre-Order)'}
                            </option>
                          ))}
                      </select>
                      {products.filter(product => product.isPreOrder).length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          No pre-order products available. Please mark a product as pre-order first.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Status Toggle - Only show when editing */}
                {editingBanner && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="isActive"
                          value="true"
                          checked={formData.isActive === true}
                          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="isActive"
                          value="false"
                          checked={formData.isActive === false}
                          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Inactive</span>
                      </label>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    {editingBanner ? 'Update Banner' : 'Add Banner'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingBanner(null);
                      setFormData({ title: '', description: '', image: '', width: '1920', height: '600', isActive: true, link: '', isPreOrder: false, preOrderProductId: '' });
                      setImagePreview('');
                      setSelectedFile(null);
                      setRatioError('');
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

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Banner"
          message={`Are you sure you want to delete "${deleteDialog.bannerTitle}"?`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </DashboardLayout>
  );
} 