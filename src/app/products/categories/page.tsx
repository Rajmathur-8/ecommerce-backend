'use client';

export const dynamic = 'force-dynamic';

import DashboardLayout from '@/components/DashboardLayout';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl, getAuthHeaders, getFormDataHeaders } from '@/lib/config';
import { useApiWithLoading } from '@/lib/apiUtils';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active' as string, // Can be 'Active' or 'Inactive'
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    categoryId: string | null;
    categoryName: string;
  }>({
    isOpen: false,
    categoryId: null,
    categoryName: ''
  });

  // Use the new API hook for managing API calls
  const { fetchData, loading, resetLoading } = useApiWithLoading();

  useEffect(() => {
    // Load categories using the new API hook
    const loadCategories = async () => {
      try {
        const data = await fetchData<any>(
          getApiUrl('/web/categories'),
          { headers: getAuthHeaders() }
        );
        setCategories(data.data || []);
      } catch (error) {
        toast.error('Failed to load categories');
      }
    };

    // Only fetch if loading is true
    if (loading) {
      loadCategories();
    }
  }, [loading]);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategory && !selectedFile) {
      toast.error('Please select an image');
      return;
    }

    try {
      const categoryId = editingCategory?._id;
      const url = editingCategory 
        ? getApiUrl(`/web/categories/${categoryId}`)
        : getApiUrl('/web/categories');
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('status', formData.status);
      
      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      }
      
      console.log('Sending request to:', url);
      console.log('Method:', method);
      console.log('Category ID:', categoryId);
      console.log('Form data:', {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        hasImage: !!selectedFile
      });
      
      const response = await fetch(url, {
        method,
        headers: getFormDataHeaders(),
        body: formDataToSend,
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        toast.success(editingCategory ? 'Category updated successfully!' : 'Category added successfully!');
        setShowAddModal(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '', status: 'Active' });
        setImagePreview('');
        setSelectedFile(null);
        // Reset loading state to refresh categories list
        resetLoading();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save category');
      }
    } catch (error) {
      toast.error('Failed to save category. Please try again.');
    }
  };

  const handleEdit = (category: any) => {
    console.log('Editing category:', category);
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      status: category.status, // Use the actual status from category
    });
    setImagePreview(category.image || '');
    setSelectedFile(null);
    setShowAddModal(true);
  };

  const handleDeleteClick = (categoryId: string, categoryName: string) => {
    setDeleteDialog({
      isOpen: true,
      categoryId,
      categoryName
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.categoryId) return;

    try {
      const response = await fetch(getApiUrl(`/web/categories/${deleteDialog.categoryId}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        toast.success('Category deleted successfully!');
        // Reset loading state to refresh categories list
        resetLoading();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete category');
      }
    } catch (error) {
      toast.error('Failed to delete category. Please try again.');
    } finally {
      setDeleteDialog({
        isOpen: false,
        categoryId: null,
        categoryName: ''
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      categoryId: null,
      categoryName: ''
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-2">Manage product categories</p>
          </div>
          <button
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: '', description: '', status: 'Active' });
              setShowAddModal(true);
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Search */}
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Categories Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Image</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Products</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category._id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{category.name}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-gray-600 max-w-xs truncate">
                        {category.description}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {category.productCount || 0} products
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        category.status 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1 text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category._id, category.name)}
                          className="p-1 text-red-600 hover:text-red-700"
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
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="input-field"
                    rows={3}
                    placeholder="Enter category description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Image {!editingCategory && '*'}
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      required={!editingCategory}
                    />
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preview
                        </label>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Status Toggle - Only show when editing */}
                {editingCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="Active"
                          checked={formData.status === 'Active'}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="Inactive"
                          checked={formData.status === 'Inactive'}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Inactive</span>
                      </label>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingCategory(null);
                      setFormData({ name: '', description: '', status: 'Active' });
                      setImagePreview('');
                      setSelectedFile(null);
                    }}
                    className="btn-secondary px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-4 py-2"
                  >
                    {editingCategory ? 'Update Category' : 'Add Category'}
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
          title="Delete Category"
          message={`Are you sure you want to delete category "${deleteDialog.categoryName}"?`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </DashboardLayout>
  );
} 