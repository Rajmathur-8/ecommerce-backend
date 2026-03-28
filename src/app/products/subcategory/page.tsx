'use client';

export const dynamic = 'force-dynamic';

import DashboardLayout from '@/components/DashboardLayout';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import { useMultipleApiWithLoading } from '@/lib/apiUtils';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function SubcategoryPage() {
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    isActive: true,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    subcategoryId: string | null;
    subcategoryName: string;
  }>({
    isOpen: false,
    subcategoryId: null,
    subcategoryName: ''
  });

  // Use the new API hook for managing API calls
  const { fetchDataWithKey, isLoading, resetLoadingForKey } = useMultipleApiWithLoading();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load subcategories using the new API hook
    const loadSubcategories = async () => {
      try {
        const data = await fetchDataWithKey<any>(
          'subcategories',
          getApiUrl('/web/subcategories'),
          { headers: getAuthHeaders() }
        );
        setSubcategories(data.data || []);
      } catch (error) {
        toast.error('Failed to load subcategories');
      }
    };

    // Load categories using the new API hook
    const loadCategories = async () => {
      try {
        const response = await fetch(getApiUrl('/web/categories'), {
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        console.log('Categories response:', data); // Debug log
        
        if (data.success && data.data) {
          setCategories(data.data);
        } else {
          setCategories([]);
        }
      } catch (error) {
        toast.error('Failed to load categories');
        setCategories([]);
      }
    };

    // Load data when component mounts
    if (loading) {
      loadSubcategories();
      loadCategories();
      setLoading(false);
    }
  }, [loading]);

  const filteredSubcategories = subcategories.filter(subcategory =>
    subcategory.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'isActive' ? value === 'active' : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    try {
      const url = editingSubcategory 
        ? getApiUrl(`/web/subcategories/${editingSubcategory._id}`)
        : getApiUrl('/web/subcategories');
      const method = editingSubcategory ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success(editingSubcategory ? 'Subcategory updated successfully!' : 'Subcategory added successfully!');
        setShowAddModal(false);
        setEditingSubcategory(null);
        setFormData({ name: '', description: '', category: '', isActive: true });
        setLoading(true);
        // Reset loading state to refresh subcategories list
        resetLoadingForKey('subcategories');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save subcategory');
      }
    } catch (error) {
      toast.error('Failed to save subcategory. Please try again.');
    }
  };

  const handleEdit = (subcategory: any) => {
    setEditingSubcategory(subcategory);
    setFormData({
      name: subcategory.name,
      description: subcategory.description,
      category: subcategory.category?._id || subcategory.category || '',
      isActive: subcategory.isActive,
    });
    setShowAddModal(true);
  };

  const handleDeleteClick = (subcategoryId: string, subcategoryName: string) => {
    setDeleteDialog({
      isOpen: true,
      subcategoryId,
      subcategoryName
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.subcategoryId) return;
    
    try {
      const response = await fetch(getApiUrl(`/web/subcategories/${deleteDialog.subcategoryId}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        toast.success('Subcategory deleted successfully!');
        setLoading(true);
        // Reset loading state to refresh subcategories list
        resetLoadingForKey('subcategories');
      
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete subcategory');
      }
    } catch (error) {
      toast.error('Failed to delete subcategory. Please try again.');
    } finally {
      setDeleteDialog({
        isOpen: false,
        subcategoryId: null,
        subcategoryName: ''
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      subcategoryId: null,
      subcategoryName: ''
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subcategories</h1>
            <p className="text-gray-600 mt-2">Manage product subcategories</p>
          </div>
          <button
            onClick={() => {
              setEditingSubcategory(null);
              setFormData({ name: '', description: '', category: '', isActive: true });
              setShowAddModal(true);
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Subcategory</span>
          </button>
        </div>

        {/* Search */}
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search subcategories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Subcategories Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Products</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubcategories.map((subcategory) => (
                  <tr key={subcategory.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{subcategory.name}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                        {subcategory.category?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-gray-600 max-w-xs truncate">
                        {subcategory.description}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {subcategory.productCount || 0} products
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        subcategory.isActive 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {subcategory.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(subcategory)}
                          className="p-1 text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(subcategory._id, subcategory.name)}
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
                {editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">No categories available. Please create categories first.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter subcategory name"
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
                    placeholder="Enter subcategory description"
                  />
                </div>
                
                {/* Status Toggle - Only show when editing */}
                {editingSubcategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="isActive"
                          value="active"
                          checked={formData.isActive === true}
                          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="isActive"
                          value="inactive"
                          checked={formData.isActive === false}
                          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
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
                      setEditingSubcategory(null);
                      setFormData({ name: '', description: '', category: '', isActive: true });
                    }}
                    className="btn-secondary px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-4 py-2"
                  >
                    {editingSubcategory ? 'Update Subcategory' : 'Add Subcategory'}
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
          title="Delete Subcategory"
          message={`Are you sure you want to delete subcategory "${deleteDialog.subcategoryName}"?`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </DashboardLayout>
  );
} 