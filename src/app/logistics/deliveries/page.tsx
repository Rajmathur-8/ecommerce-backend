'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useState, useEffect, useCallback } from 'react';
import { getApiUrl, getAuthHeaders } from '../../../lib/config';
import { TableSkeleton, CardSkeleton } from '@/components/Skeleton';
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  Globe,
  Users,
  X
} from 'lucide-react';

interface DeliveryTracking {
  _id: string;
  order: {
    _id: string;
    orderNumber?: string;
    orderStatus: string;
    total: number;
    items?: Array<{
      product?: {
        productName: string;
        images: string[];
      };
      manualProduct?: {
        productName: string;
        image?: string;
      };
    }>;
  };
  shippingPartner: {
    _id: string;
    name: string;
    trackingUrl: string | null;
  };
  trackingNumber: string;
  awbNumber?: string | null;
  logisticsType?: 'ithink' | 'self';
  selfLogisticsDetails?: {
    name: string;
    email: string;
    phone: string;
    address: string;
  } | null;
  status: string;
  currentLocation: {
    city: string;
    state: string;
  };
  estimatedDelivery: string;
  actualDelivery: string;
  createdAt: string;
  updatedAt?: string;
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryTracking | null>(null);
  const [isAutoTracking, setIsAutoTracking] = useState(false);

  // Fetch deliveries
  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (selectedStatus) {
        params.append('status', selectedStatus);
      }

      const response = await fetch(`${getApiUrl('/admin/logistics/deliveries')}?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setDeliveries(data.data.deliveries || []);
        setTotalPages(data.data.totalPages || 1);
      }
    } catch (error) {
      setDeliveries([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedStatus]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Auto-track orders every 60 seconds (1 minute)
  useEffect(() => {
    const autoTrackInterval = setInterval(async () => {
      try {
        setIsAutoTracking(true);
        console.log('🔄 Auto-tracking orders...');
        const response = await fetch(getApiUrl('/web/logistics/auto-track'), {
          method: 'POST',
          headers: getAuthHeaders(),
        });

        const data = await response.json();
        if (data.success && data.data.updatedOrders.length > 0) {
          console.log('✅ Auto-tracking completed:', data);
          // Refresh deliveries to show updated statuses
          await fetchDeliveries();
        }
      } catch (error) {
        console.error('Auto-track error:', error);
      } finally {
        setIsAutoTracking(false);
      }
    }, 60000); // 60 seconds (1 minute) - reduced frequency to avoid too many API calls

    return () => clearInterval(autoTrackInterval);
  }, [fetchDeliveries]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'order_placed': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'in_transit': return 'text-blue-600 bg-blue-100';
      case 'out_for_delivery': return 'text-orange-600 bg-orange-100';
      case 'picked_up': return 'text-purple-600 bg-purple-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'returned': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const handleExport = () => {
    try {
      // Create CSV content
      const headers = ['Order Number', 'Tracking Number', 'Partner', 'Status', 'Current Location', 'Delivery Date', 'Total'];
      const rows = deliveries.map(delivery => [
        delivery.order.orderNumber || delivery.order._id.slice(-6).toUpperCase(),
        delivery.trackingNumber || '-',
        delivery.shippingPartner.name || '-',
        delivery.status || '-',
        delivery.currentLocation ? `${delivery.currentLocation.city}, ${delivery.currentLocation.state}` : '-',
        delivery.status === 'delivered' && delivery.actualDelivery 
          ? formatDate(delivery.actualDelivery) 
          : (delivery.estimatedDelivery ? formatDate(delivery.estimatedDelivery) : '-'),
        `₹${delivery.order.total.toLocaleString()}`
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `deliveries_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export deliveries. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'order_placed': return <Package className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'in_transit': return <Truck className="w-4 h-4" />;
      case 'out_for_delivery': return <Package className="w-4 h-4" />;
      case 'picked_up': return <MapPin className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <Breadcrumbs items={[
          { label: 'Logistics', href: '/logistics' },
          { label: 'Deliveries' }
        ]} />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Deliveries</h1>
              <p className="text-gray-600 mt-2">Track and manage all your deliveries in real-time</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleExport}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>


        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tracking number or AWB..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="confirmed">Order Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('');
                setCurrentPage(1); // Reset to first page when clearing filters
              }}
              className="flex items-center px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Deliveries Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                            <div>
                              <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                          </div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                          <div className="h-3 bg-gray-200 rounded w-12"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
                      <p className="text-gray-500 mb-6">Deliveries will appear here automatically when orders are confirmed and shipped through iThink Logistics or Self Logistics</p>
                    </td>
                  </tr>
                ) : (
                  deliveries.map((delivery) => (
                    <tr key={delivery._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                              <Package className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900 font-mono">
                                {delivery.trackingNumber}
                              </div>
                              {delivery.awbNumber && delivery.logisticsType !== 'self' && (
                                <div className="text-xs text-gray-500">
                                  AWB: {delivery.awbNumber}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Created: {formatDateTime(delivery.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            {delivery.order.items && delivery.order.items.length > 0 && (
                              <>
                                {(() => {
                                  const firstItem = delivery.order.items[0];
                                  const product = firstItem.product || firstItem.manualProduct;
                                  const imageUrl = (product && 'images' in product && product.images?.[0]) || (product && 'image' in product ? product.image : null);
                                  return imageUrl ? (
                                    <img 
                                      src={imageUrl} 
                                      alt={product?.productName || 'Product'} 
                                      className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <Package className="w-6 h-6 text-gray-400" />
                                    </div>
                                  );
                                })()}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 truncate">
                                    {(() => {
                                      const firstItem = delivery.order.items[0];
                                      const product = firstItem.product || firstItem.manualProduct;
                                      return product?.productName || 'Product';
                                    })()}
                                  </div>
                                  {delivery.order.items.length > 1 && (
                                    <div className="text-xs text-gray-500">
                                      +{delivery.order.items.length - 1} more item{delivery.order.items.length - 1 > 1 ? 's' : ''}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              #{delivery.order.orderNumber || delivery.order._id.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-gray-600 font-medium">
                              ₹{delivery.order.total.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {delivery.order.orderStatus}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                              <Truck className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {delivery.shippingPartner.name}
                            </div>
                          </div>
                          {delivery.logisticsType === 'self' && delivery.selfLogisticsDetails && (
                            <div className="ml-11 text-xs text-gray-600 space-y-0.5">
                              <div className="font-medium text-gray-700">{delivery.selfLogisticsDetails.name}</div>
                              <div>{delivery.selfLogisticsDetails.email}</div>
                              <div>{delivery.selfLogisticsDetails.phone}</div>
                              <div className="text-gray-500 truncate max-w-xs">{delivery.selfLogisticsDetails.address}</div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                          {getStatusIcon(delivery.status)}
                          <span className="ml-1 capitalize">{delivery.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {delivery.currentLocation ? (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">
                              {delivery.currentLocation.city}, {delivery.currentLocation.state}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const isDelivered = delivery.status?.toLowerCase() === 'delivered' || delivery.order.orderStatus?.toLowerCase() === 'delivered';
                          
                          if (isDelivered) {
                            // If delivered, show actual delivery date (deliveredAt) or updatedAt as fallback
                            const deliveryDate = delivery.actualDelivery || delivery.updatedAt;
                            if (!deliveryDate) {
                              return (
                                <div className="text-sm text-gray-500">
                                  Delivered
                                </div>
                              );
                            }
                            return (
                              <div className="text-sm text-green-600 font-medium">
                                Delivered: {formatDate(deliveryDate)}
                              </div>
                            );
                          } else {
                            // If not delivered, show estimated delivery date
                            return delivery.estimatedDelivery ? (
                              <div className="text-sm text-gray-900">
                                Est: {formatDate(delivery.estimatedDelivery)}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">-</div>
                            );
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => {
                              setSelectedDelivery(delivery);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {delivery.shippingPartner.trackingUrl && (
                            <a 
                              href={delivery.shippingPartner.trackingUrl.replace('{tracking}', delivery.trackingNumber)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                            >
                              <Globe className="w-4 h-4" />
                            </a>
                          )}
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
            <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delivery Details Modal */}
        {showDetailsModal && selectedDelivery && (
          <DeliveryDetailsModal
            delivery={selectedDelivery}
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedDelivery(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// Delivery Details Modal Component
interface DeliveryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: DeliveryTracking;
}

function DeliveryDetailsModal({ isOpen, onClose, delivery }: DeliveryDetailsModalProps) {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && delivery) {
      fetchTimeline();
    }
  }, [isOpen, delivery]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl('/admin/logistics/shipment')}/${delivery.trackingNumber}/timeline`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setTimeline(data.data.timeline || []);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'order_placed': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'in_transit': return 'text-blue-600 bg-blue-100';
      case 'out_for_delivery': return 'text-orange-600 bg-orange-100';
      case 'picked_up': return 'text-purple-600 bg-purple-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'returned': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Delivery Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Delivery Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tracking Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tracking Number:</span>
                    <span className="text-sm font-mono font-semibold">{delivery.trackingNumber}</span>
                  </div>
                  {delivery.awbNumber && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">AWB Number:</span>
                      <span className="text-sm font-mono">{delivery.awbNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(delivery.status)}`}>
                      {delivery.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Order ID:</span>
                    <span className="text-sm font-semibold">#{delivery.order._id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Order Total:</span>
                    <span className="text-sm font-semibold">₹{delivery.order.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Order Status:</span>
                    <span className="text-sm">{delivery.order.orderStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Partner */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping Partner</h3>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{delivery.shippingPartner.name}</p>
                <p className="text-sm text-gray-600">{delivery.shippingPartner.name}</p>
              </div>
              <div className="ml-auto">
                {delivery.shippingPartner.trackingUrl ? (
                  <a 
                    href={delivery.shippingPartner.trackingUrl.replace('{tracking}', delivery.trackingNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Track on Partner Site →
                  </a>
                ) : (
                  <span className="text-gray-500 text-sm">No tracking URL available</span>
                )}
              </div>
            </div>
          </div>

          {/* Current Location */}
          {delivery.currentLocation && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Location</h3>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {delivery.currentLocation.city}, {delivery.currentLocation.state}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Timeline</h3>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse flex items-center space-x-4">
                    <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : timeline.length > 0 ? (
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className={`w-4 h-4 rounded-full mt-1 ${
                      index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                    }`}></div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{event.status}</p>
                      <p className="text-sm text-gray-600">{event.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(event.timestamp)}
                      </p>
                      {event.location && (
                        <p className="text-xs text-gray-500">
                          📍 {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No timeline events available</p>
              </div>
            )}
          </div>

          {/* Delivery Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Dates</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estimated Delivery:</span>
                  <span className="text-sm">
                    {delivery.estimatedDelivery ? formatDateTime(delivery.estimatedDelivery) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Actual Delivery:</span>
                  <span className="text-sm">
                    {(() => {
                      const isDelivered = delivery.status?.toLowerCase() === 'delivered' || 
                                         delivery.order.orderStatus?.toLowerCase() === 'delivered';
                      if (isDelivered) {
                        // If delivered, show actualDelivery or updatedAt as fallback
                        const deliveryDate = delivery.actualDelivery || delivery.updatedAt;
                        return deliveryDate ? formatDateTime(deliveryDate) : '-';
                      }
                      return '-';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm">{formatDateTime(delivery.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {delivery.shippingPartner.trackingUrl ? (
            <a 
              href={delivery.shippingPartner.trackingUrl.replace('{tracking}', delivery.trackingNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Track on Partner Site
            </a>
          ) : (
            <span className="px-6 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
              No tracking URL available
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
