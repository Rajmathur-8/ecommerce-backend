'use client';

export const dynamic = 'force-dynamic';

import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, Eye, CheckCircle, XCircle, Save, X } from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import { TableSkeleton } from '@/components/Skeleton';
import ConfirmDialog from '@/components/ConfirmDialog';
import toast from 'react-hot-toast';

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFAQs, setTotalFAQs] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    isActive: true,
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    faqId: string | null;
    faqQuestion: string;
  }>({
    isOpen: false,
    faqId: null,
    faqQuestion: ''
  });

  const fetchFAQs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '6',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedStatus !== 'all' && { isActive: selectedStatus === 'active' ? 'true' : 'false' }),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const response = await fetch(getApiUrl(`/admin/faqs?${params}`), {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFaqs(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalFAQs(data.pagination?.total || 0);
      }
    } catch (error) {
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, selectedStatus]);

  const fetchStats = async () => {
    try {
      const response = await fetch(getApiUrl('/admin/faqs/stats'), {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedStatus]);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Please fill in both question and answer');
      return;
    }

    try {
      const url = editingFAQ
        ? getApiUrl(`/admin/faqs/${editingFAQ._id}`)
        : getApiUrl('/admin/faqs');
      const method = editingFAQ ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingFAQ ? 'FAQ updated successfully' : 'FAQ created successfully');
        setShowAddModal(false);
        setEditingFAQ(null);
        setFormData({
          question: '',
          answer: '',
          category: 'general',
          isActive: true,
          tags: []
        });
        fetchFAQs();
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save FAQ');
      }
    } catch (error) {
      toast.error('Failed to save FAQ');
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isActive: faq.isActive,
      tags: faq.tags || []
    });
    setShowAddModal(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.faqId) return;

    try {
      const response = await fetch(getApiUrl(`/admin/faqs/${deleteDialog.faqId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success('FAQ deleted successfully');
        setDeleteDialog({ isOpen: false, faqId: null, faqQuestion: '' });
        fetchFAQs();
        fetchStats();
      } else {
        toast.error('Failed to delete FAQ');
      }
    } catch (error) {
      toast.error('Failed to delete FAQ');
    }
  };

  const handleToggleStatus = async (faqId: string) => {
    try {
      const response = await fetch(getApiUrl(`/admin/faqs/${faqId}/toggle-status`), {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success('FAQ status updated successfully');
        fetchFAQs();
        fetchStats();
      } else {
        toast.error('Failed to update FAQ status');
      }
    } catch (error) {
      toast.error('Failed to update FAQ status');
    }
  };


  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const categoryColors: { [key: string]: string } = {
    general: 'bg-blue-100 text-blue-800',
    product: 'bg-green-100 text-green-800',
    order: 'bg-purple-100 text-purple-800',
    payment: 'bg-yellow-100 text-yellow-800',
    delivery: 'bg-orange-100 text-orange-800',
    return: 'bg-red-100 text-red-800',
    returns: 'bg-red-100 text-red-800',
    account: 'bg-indigo-100 text-indigo-800',
    warranty: 'bg-teal-100 text-teal-800',
    authenticity: 'bg-pink-100 text-pink-800',
    installation: 'bg-cyan-100 text-cyan-800',
    damage: 'bg-rose-100 text-rose-800',
    specifications: 'bg-violet-100 text-violet-800',
    support: 'bg-emerald-100 text-emerald-800',
    accessories: 'bg-amber-100 text-amber-800',
    other: 'bg-gray-100 text-gray-800'
  };

  if (loading && !faqs.length) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Breadcrumbs items={[{ label: 'Enquiries' }, { label: 'FAQ Management' }]} />
          <TableSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Enquiries' }, { label: 'FAQ Management' }]} />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">FAQ Management</h1>
            <p className="text-gray-600 mt-2">Manage frequently asked questions for chat support</p>
          </div>
          <button
            onClick={() => {
              setEditingFAQ(null);
              setFormData({
                question: '',
                answer: '',
                category: 'general',
                isActive: true,
                tags: []
              });
              setShowAddModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add FAQ
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total FAQs</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{stats.active || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.inactive || 0}</p>
                </div>
                <XCircle className="w-8 h-8 text-gray-500" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{stats.byCategory?.length || 0}</p>
                </div>
                <Search className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="product">Product</option>
              <option value="order">Order</option>
              <option value="payment">Payment</option>
              <option value="delivery">Delivery</option>
              <option value="return">Return</option>
              <option value="returns">Returns</option>
              <option value="warranty">Warranty</option>
              <option value="authenticity">Authenticity</option>
              <option value="installation">Installation</option>
              <option value="damage">Damage</option>
              <option value="specifications">Specifications</option>
              <option value="support">Support</option>
              <option value="accessories">Accessories</option>
              <option value="account">Account</option>
              <option value="other">Other</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* FAQs Table */}
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Question</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Answer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No FAQs found
                  </td>
                </tr>
              ) : (
                faqs.map((faq) => (
                  <tr key={faq._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{faq.question}</div>
                      {faq.tags && faq.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {faq.tags.map((tag, idx) => (
                            <span key={idx} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-700 line-clamp-2 max-w-md">
                        {faq.answer}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded ${categoryColors[faq.category] || categoryColors.other}`}>
                        {faq.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(faq._id)}
                        className={`text-xs px-2 py-1 rounded ${
                          faq.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {faq.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatDate(faq.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(faq)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteDialog({
                              isOpen: true,
                              faqId: faq._id,
                              faqQuestion: faq.question
                            });
                          }}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
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

          <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-600">
            Showing {((currentPage - 1) * 6) + 1} to {Math.min(currentPage * 6, totalFAQs)} of {totalFAQs} results
          </p>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(currentPage)}
              className={`px-3 py-1 rounded-md text-sm ${
                currentPage === currentPage
                  ? 'bg-primary-600 text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {currentPage}
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
        
        </div>

        {/* Pagination */}
        

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">
                {editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Enter question"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                    rows={6}
                    className="input-field w-full"
                    placeholder="Enter answer"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-12">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="input-field w-full"
                    >
                      <option value="general">General</option>
                      <option value="product">Product</option>
                      <option value="order">Order</option>
                      <option value="payment">Payment</option>
                      <option value="delivery">Delivery</option>
                      <option value="return">Return</option>
                      <option value="warranty">Warranty</option>
                      <option value="authenticity">Authenticity</option>
                      <option value="installation">Installation</option>
                      <option value="damage">Damage</option>
                      <option value="specifications">Specifications</option>
                      <option value="support">Support</option>
                      <option value="accessories">Accessories</option>
                      <option value="account">Account</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      className="input-field flex-1"
                      placeholder="Add tag"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="btn-secondary"
                    >
                      Add
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-blue-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingFAQ(null);
                      setFormData({
                        question: '',
                        answer: '',
                        category: 'general',
                        isActive: true,
                        tags: []
                      });
                    }}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingFAQ ? 'Update FAQ' : 'Create FAQ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, faqId: null, faqQuestion: '' })}
          onConfirm={handleDelete}
          title="Delete FAQ"
          message={`Are you sure you want to delete FAQ: "${deleteDialog.faqQuestion}"?`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </DashboardLayout>
  );
}

