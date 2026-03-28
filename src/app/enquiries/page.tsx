'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useState, useEffect, useCallback } from 'react';
import { Search, Mail, Phone, Calendar, Eye, MessageSquare, Filter, Reply, Trash2, CheckCircle } from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import { TableSkeleton } from '@/components/Skeleton';
import ConfirmDialog from '@/components/ConfirmDialog';
import toast from 'react-hot-toast';

interface Enquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  subject: string;
  type: string;
  status: string;
  priority: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  order?: {
    _id: string;
    orderNumber: string;
  };
  product?: {
    _id: string;
    productName: string;
  };
  adminResponse?: string;
  repliedBy?: {
    _id: string;
    name: string;
  };
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEnquiries, setTotalEnquiries] = useState(0);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    enquiryId: string | null;
    enquiryName: string;
  }>({
    isOpen: false,
    enquiryId: null,
    enquiryName: ''
  });

  const fetchEnquiries = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedType !== 'all' && { type: selectedType }),
        ...(selectedPriority !== 'all' && { priority: selectedPriority })
      });

      const response = await fetch(getApiUrl(`/admin/enquiries?${params}`), {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEnquiries(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalEnquiries(data.pagination?.total || 0);
      }
    } catch (error) {
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedStatus, selectedType, selectedPriority]);

  const fetchStats = async () => {
    try {
      const response = await fetch(getApiUrl('/admin/enquiries/stats'), {
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
  }, [selectedStatus, selectedType, selectedPriority]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const handleStatusUpdate = async (enquiryId: string, status: string) => {
    try {
      const response = await fetch(getApiUrl(`/admin/enquiries/${enquiryId}/status`), {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success('Status updated successfully');
        fetchEnquiries();
        fetchStats();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleReply = async () => {
    if (!selectedEnquiry || !replyMessage.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/admin/enquiries/${selectedEnquiry._id}/reply`), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminResponse: replyMessage })
      });

      if (response.ok) {
        toast.success('Reply sent successfully');
        setShowReplyModal(false);
        setReplyMessage('');
        setSelectedEnquiry(null);
        fetchEnquiries();
        fetchStats();
      } else {
        toast.error('Failed to send reply');
      }
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.enquiryId) return;

    try {
      const response = await fetch(getApiUrl(`/admin/enquiries/${deleteDialog.enquiryId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success('Enquiry deleted successfully');
        setDeleteDialog({ isOpen: false, enquiryId: null, enquiryName: '' });
        fetchEnquiries();
        fetchStats();
      } else {
        toast.error('Failed to delete enquiry');
      }
    } catch (error) {
      toast.error('Failed to delete enquiry');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      new: 'bg-blue-100 text-blue-800',
      read: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-purple-100 text-purple-800',
      replied: 'bg-green-100 text-green-800',
      resolved: 'bg-gray-100 text-gray-800',
      closed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading && !enquiries.length) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Breadcrumbs items={[{ label: 'Enquiries' }]} />
          <TableSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Enquiries' }]} />
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enquiries</h1>
          <p className="text-gray-600 mt-2">Manage customer enquiries and support requests</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Enquiries</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total || 0}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{stats.new || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{stats.resolved || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today</p>
                  <p className="text-2xl font-bold text-orange-900 mt-1">{stats.today || 0}</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search enquiries..."
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
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="in_progress">In Progress</option>
              <option value="replied">Replied</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-field"
            >
              <option value="all">All Types</option>
              <option value="general">General</option>
              <option value="product">Product</option>
              <option value="order">Order</option>
              <option value="payment">Payment</option>
              <option value="delivery">Delivery</option>
              <option value="return">Return</option>
              <option value="other">Other</option>
            </select>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="input-field"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Enquiries Table */}
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Subject</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Priority</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No enquiries found
                  </td>
                </tr>
              ) : (
                enquiries.map((enquiry) => (
                  <tr key={enquiry._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{enquiry.name}</div>
                      {enquiry.phone && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {enquiry.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {enquiry.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900">{enquiry.subject}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                        {enquiry.message.substring(0, 50)}...
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                        {enquiry.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={enquiry.status}
                        onChange={(e) => handleStatusUpdate(enquiry._id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border-0 ${getStatusColor(enquiry.status)}`}
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="in_progress">In Progress</option>
                        <option value="replied">Replied</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(enquiry.priority)}`}>
                        {enquiry.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatDate(enquiry.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedEnquiry(enquiry);
                            setShowReplyModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                          title="Reply"
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEnquiry(enquiry);
                            setShowViewModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-700"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteDialog({
                              isOpen: true,
                              enquiryId: enquiry._id,
                              enquiryName: enquiry.name
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
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalEnquiries)} of {totalEnquiries} enquiries
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Reply Modal */}
        {showReplyModal && selectedEnquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Reply to Enquiry</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>From:</strong> {selectedEnquiry.name} ({selectedEnquiry.email})
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Subject:</strong> {selectedEnquiry.subject}
                </p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mb-4">
                  {selectedEnquiry.message}
                </p>
              </div>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={6}
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your reply here..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setReplyMessage('');
                    setSelectedEnquiry(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  className="flex-1 btn-primary"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showViewModal && selectedEnquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Enquiry Details</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedEnquiry(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="text-sm font-medium text-gray-900">{selectedEnquiry.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-sm font-medium text-gray-900">{selectedEnquiry.email}</p>
                    </div>
                    {selectedEnquiry.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{selectedEnquiry.phone}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedEnquiry.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enquiry Details */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Enquiry Details</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Subject</p>
                      <p className="text-sm font-medium text-gray-900">{selectedEnquiry.subject}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {selectedEnquiry.type}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        selectedEnquiry.status === 'replied' 
                          ? 'bg-green-100 text-green-800'
                          : selectedEnquiry.status === 'resolved'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedEnquiry.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Priority</p>
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        {selectedEnquiry.priority}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Message</p>
                      <p className="text-sm text-gray-900 bg-white p-3 rounded border border-blue-200 whitespace-pre-wrap">
                        {selectedEnquiry.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin Reply */}
                {selectedEnquiry.adminResponse && (
                  <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Admin Reply</h4>
                      {selectedEnquiry.repliedAt && (
                        <p className="text-xs text-gray-600">
                          Replied on: {new Date(selectedEnquiry.repliedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 bg-white p-3 rounded border border-green-200 whitespace-pre-wrap">
                      {selectedEnquiry.adminResponse}
                    </p>
                  </div>
                )}

                {/* No Reply Message */}
                {!selectedEnquiry.adminResponse && (
                  <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                    <p className="text-sm text-yellow-800">No reply has been sent yet.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedEnquiry(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  Close
                </button>
                {!selectedEnquiry.adminResponse && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setShowReplyModal(true);
                    }}
                    className="flex-1 btn-primary"
                  >
                    Reply
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, enquiryId: null, enquiryName: '' })}
          onConfirm={handleDelete}
          title="Delete Enquiry"
          message={`Are you sure you want to delete enquiry from "${deleteDialog.enquiryName}"?`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </DashboardLayout>
  );
}

