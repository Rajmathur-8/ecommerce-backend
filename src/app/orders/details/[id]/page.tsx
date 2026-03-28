"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getApiUrl, getAuthHeaders, formatCurrency } from '@/lib/config';
import { Package, Truck, CheckCircle, Clock, XCircle, RefreshCw, MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'react-toastify';

interface Order {
  _id: string;
  user: {
    _id: string;
    email: string;
    name: string;
    phone: string;
  };
  items: Array<{
    product: {
      _id: string;
      productName: string;
      images: string[];
      price: number;
      description?: string;
    } | null;
    manualProduct?: {
      productName: string;
      images: string[];
      price: number;
      discountPrice?: number;
      sku?: string;
      isManual: boolean;
    };
    quantity: number;
    price: number;
    variant?: string;
    warranty?: {
      _id: string;
      name: string;
      price: number;
      duration: number;
    } | string | null;
    isFrequentlyBoughtTogether?: boolean;
  }>;
  frequentlyBoughtTogether?: Array<{
    cartItemId: string;
    product?: {
      _id: string;
      productName: string;
      images: string[];
      price: number;
    } | string | null;
    manualProduct?: {
      productName: string;
      images: string[];
      price: number;
      discountPrice?: number;
      sku?: string;
      isManual: boolean;
    };
    quantity: number;
    price: number;
    variant?: string;
  }>;
  address: {
    name: string;
    mobile: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  subtotal: number;
  discountAmount: number;
  couponCode?: string | null;
  couponDiscount?: number;
  promoCode?: string | null;
  promoDiscount?: number;
  giftVoucherCode?: string | null;
  giftVoucherDiscount?: number;
  rewardPointsDiscount?: number;
  shippingCharges: number;
  total: number;
  trackingNumber?: string;
  estimatedDelivery?: string;
  returnReason?: string;
  returnDescription?: string;
  ithinkAwbNumber?: string;
  ithinkTrackingNumber?: string;
  logisticsSynced?: boolean;
  logisticsSyncedAt?: string;
  logisticsType?: 'ithink' | 'self';
  returnDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface TimelineItem {
  status: string;
  date: string;
  description: string;
}

const statusSteps = [
  'Order Placed',
  'Order Confirmed', 
  'Order Shipped',
  'Order Delivered',
  'Order Returned',
  'Order Cancelled'
];

const statusColors = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'confirmed': 'bg-blue-100 text-blue-800',
  'shipped': 'bg-purple-100 text-purple-800',
  'delivered': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800',
  'returned': 'bg-orange-100 text-orange-800',
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  // Fetch order details
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/admin/orders/${orderId}`), {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.data.order);
        setTimeline(data.data.timeline || []);
        
        // Set tracking number and estimated delivery if available
        if (data.data.order.trackingNumber) {
          setTrackingNumber(data.data.order.trackingNumber);
        }
        if (data.data.order.estimatedDelivery) {
          setEstimatedDelivery(data.data.order.estimatedDelivery);
        }
      } else {
        setOrder(null);
        setTimeline([]);
      }
    } catch (error) {
      setOrder(null);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (newStatus: string) => {
    try {
      console.log('🔄 Starting order status update...');
      console.log('📋 Order ID:', orderId);
      console.log('📋 New Status:', newStatus);
      
      setUpdating(true);
      
      // If cancelling or returning an order that has been synced with iThink Logistics
      if ((newStatus === 'cancelled' || newStatus === 'returned') && order?.logisticsSynced && order?.ithinkAwbNumber) {
        console.log('🚫 Order has iThink Logistics AWB, cancelling with iThink...');
        
        try {
          const cancelResponse = await fetch(getApiUrl('/web/logistics/cancel-ithink'), {
            method: 'POST',
            headers: {
              ...getAuthHeaders(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId,
              awbNumbers: order.ithinkAwbNumber
            }),
          });

          const cancelData = await cancelResponse.json();
          console.log('🚫 iThink Logistics cancel response:', cancelData);

          if (cancelResponse.ok && cancelData.success) {
            console.log('✅ Order cancelled successfully with iThink Logistics');
          } else {
            // Continue with order status update even if iThink cancel fails
          }
        } catch (cancelError) {
          // Continue with order status update even if iThink cancel fails
        }
      }
      
      const apiUrl = getApiUrl(`/admin/orders/${orderId}/status`);
      const headers = getAuthHeaders();
      const body = JSON.stringify({ orderStatus: newStatus });
      
      console.log('🌐 API URL:', apiUrl);
      console.log('🔑 Headers:', headers);
      console.log('📦 Request Body:', body);
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: headers,
        body: body,
      });

      console.log('📡 Response Status:', response.status);
      console.log('📡 Response OK:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Order status updated successfully:', responseData);
        // Refresh order details after status update
        await fetchOrderDetails();
      } else {
        const errorData = await response.text();
      }
    } catch (error) {
    } finally {
      setUpdating(false);
    }
  };

  // Update tracking information and sync with IThink Logistics
  const updateTrackingInfo = async () => {
    try {
      setUpdating(true);
      
      // Check if order is using self logistics
      if (order?.logisticsType === 'self') {
        // For self logistics, skip iThink sync and directly update order status
        const response = await fetch(getApiUrl(`/admin/orders/${orderId}/status`), {
          method: 'PUT',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            orderStatus: 'shipped',
            trackingNumber: trackingNumber.trim(),
            estimatedDelivery: estimatedDelivery || null
          }),
        });

        if (response.ok) {
          toast.success('Order shipped successfully!');
          await fetchOrderDetails();
        } else {
          toast.error('Failed to update order status');
        }
      } else {
        // For iThink Logistics, sync with iThink first
        // Step 1: Call backend API to sync order with IThink Logistics (sync.json)
        const syncResponse = await fetch(getApiUrl(`/web/logistics/sync-ithink`), {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            trackingNumber: trackingNumber.trim(),
          }),
        });

        const syncData = await syncResponse.json();
        console.log('IThink Logistics sync response:', syncData);

        if (syncResponse.ok && syncData.success) {
          // Step 2: Update order status to shipped
          const response = await fetch(getApiUrl(`/admin/orders/${orderId}/status`), {
            method: 'PUT',
            headers: getAuthHeaders(),
          body: JSON.stringify({ 
            orderStatus: 'shipped',
            trackingNumber: syncData.data?.trackingNumber || trackingNumber,
            estimatedDelivery: syncData.data?.estimatedDelivery || estimatedDelivery,
            ithinkAwbNumber: syncData.data?.awbNumber,
            ithinkTrackingNumber: syncData.data?.trackingNumber,
            logisticsSynced: true,
            logisticsSyncedAt: new Date().toISOString()
          }),
          });

          if (response.ok) {
            toast.success('Order shipped successfully!');
            await fetchOrderDetails();
          } else {
            toast.error('Failed to update order status');
          }
        } else {
          toast.error(syncData.message || 'Failed to sync with IThink Logistics');
        }
      }
    } catch (error) {
      toast.error('Error processing shipment');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'confirmed': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      case 'returned': return 4;
      case 'cancelled': return 5;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: 'Orders', href: '/orders/all-orders' },
            { label: 'Order Details' }
          ]} />
          
          {/* Header Skeleton */}
          <div className="flex items-center space-x-4 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Products Card Skeleton */}
              <div className="card animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                      <div className="w-20 h-4 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
                {/* Order Summary Skeleton */}
                <div className="mt-6 pt-6 border-t space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <div className="h-5 bg-gray-200 rounded w-12"></div>
                    <div className="h-5 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>

              {/* Customer Details Card Skeleton */}
              <div className="card animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-40"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-gray-200 rounded mt-1"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-36"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                      <div className="h-3 bg-gray-200 rounded w-40"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Timeline and Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Order Timeline Skeleton */}
              <div className="card animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-28 mb-4"></div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-3 h-3 bg-gray-200 rounded-full mt-2"></div>
                        {i < 2 && <div className="w-0.5 h-8 bg-gray-200 mx-auto mt-1"></div>}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Information Skeleton */}
              <div className="card animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i}>
                      <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-28"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Actions Skeleton */}
              <div className="card animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
          <p className="text-gray-600">The order you're looking for doesn't exist.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: 'Orders', href: '/orders/all-orders' },
          { label: `Order #${order._id.slice(-6).toUpperCase()}` }
        ]} />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600 mt-1">Order #{order._id.slice(-6).toUpperCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Products</h2>
              <div className="space-y-4">
                {order.items.filter((item) => !item.isFrequentlyBoughtTogether).map((item, index) => {
                  const productPrice = item.price * item.quantity;
                  let warrantyPrice = 0;
                  if (item.warranty && typeof item.warranty === 'object' && item.warranty.price) {
                    warrantyPrice = item.warranty.price * item.quantity;
                  }
                  const itemTotal = productPrice + warrantyPrice;
                  
                  // Handle manual products (frequently bought together items)
                  const isManualProduct = item.manualProduct && item.manualProduct.productName;
                  const productImage = isManualProduct 
                    ? (item.manualProduct?.images && item.manualProduct.images[0] ? item.manualProduct.images[0] : '/placeholder-product.svg')
                    : (item.product && item.product.images && item.product.images[0] 
                        ? item.product.images[0] 
                        : '/placeholder-product.svg');
                  const productName = isManualProduct
                    ? item.manualProduct?.productName
                    : (item.product?.productName || 'Product');
                  
                  // Parse variant if it exists
                  let variantDisplay = null;
                  if (item.variant) {
                    try {
                      const variantData = typeof item.variant === 'string' ? JSON.parse(item.variant) : item.variant;
                      if (variantData && typeof variantData === 'object' && !Array.isArray(variantData)) {
                        const attributes = variantData.attributes || variantData;
                        const variantAttrs = Object.entries(attributes)
                          .filter(([key, value]) => 
                            key !== 'price' && 
                            key !== 'stock' && 
                            key !== 'discountPrice' && 
                            key !== 'variantName' && 
                            key !== 'attributes' && 
                            key !== 'sku' &&
                            (typeof value === 'string' || typeof value === 'number') &&
                            value !== '' &&
                            value !== null &&
                            value !== undefined
                          )
                          .map(([, value]) => String(value));
                        
                        if (variantAttrs.length > 0) {
                          variantDisplay = variantAttrs;
                        } else if (variantData.variantName) {
                          variantDisplay = [variantData.variantName];
                        }
                      }
                    } catch (error) {
                      // If parsing fails, ignore variant
                    }
                  }
                  
                  return (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <img
                      src={productImage}
                      alt={productName}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{productName}</h3>
                      {variantDisplay && variantDisplay.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {variantDisplay.map((attr, attrIndex) => (
                            <span key={attrIndex} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                              {attr}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Price: {formatCurrency(item.price)}</p>
                      {item.warranty && typeof item.warranty === 'object' && item.warranty.name && (
                        <p className="text-sm text-indigo-600 font-medium mt-1">
                          Extended Warranty: {item.warranty.name} ({item.warranty.duration} months)
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(itemTotal)}</p>
                      {warrantyPrice > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          (Product: {formatCurrency(productPrice)} + Warranty: {formatCurrency(warrantyPrice)})
                        </p>
                      )}
                    </div>
                  </div>
                  );
                })}
                
                {/* Frequently Bought Together Items */}
                {order.frequentlyBoughtTogether && order.frequentlyBoughtTogether.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-indigo-700 mb-4">Frequently Bought Together:</h3>
                    <div className="space-y-3">
                      {order.frequentlyBoughtTogether.map((fbtItem, fbtIndex) => {
                        // Check if it's a manual product or regular product
                        const isManualProduct = fbtItem.manualProduct && fbtItem.manualProduct.productName;
                        const productImage = isManualProduct 
                          ? (fbtItem.manualProduct?.images && fbtItem.manualProduct.images[0] ? fbtItem.manualProduct.images[0] : "/placeholder-product.svg")
                          : (fbtItem.product && typeof fbtItem.product === 'object' && fbtItem.product.images && fbtItem.product.images[0]
                              ? fbtItem.product.images[0]
                              : "/placeholder-product.svg");
                        const productName = isManualProduct
                          ? fbtItem.manualProduct?.productName
                          : (typeof fbtItem.product === 'string'
                              ? `Product ID: ${fbtItem.product}`
                              : (fbtItem.product && fbtItem.product.productName) || 'Product');
                        
                        // Parse variant if it exists
                        let variantDisplay = null;
                        if (fbtItem.variant) {
                          try {
                            const variantData = typeof fbtItem.variant === 'string' ? JSON.parse(fbtItem.variant) : fbtItem.variant;
                            if (variantData && typeof variantData === 'object' && !Array.isArray(variantData)) {
                              const attributes = variantData.attributes || variantData;
                              const variantAttrs = Object.entries(attributes)
                                .filter(([key, value]) => 
                                  key !== 'price' && 
                                  key !== 'stock' && 
                                  key !== 'discountPrice' && 
                                  key !== 'variantName' && 
                                  key !== 'attributes' && 
                                  key !== 'sku' &&
                                  (typeof value === 'string' || typeof value === 'number') &&
                                  value !== '' &&
                                  value !== null &&
                                  value !== undefined
                                )
                                .map(([, value]) => String(value));
                              
                              if (variantAttrs.length > 0) {
                                variantDisplay = variantAttrs;
                              } else if (variantData.variantName) {
                                variantDisplay = [variantData.variantName];
                              }
                            }
                          } catch (error) {
                            // If parsing fails, ignore variant
                          }
                        }
                        
                        return (
                          <div key={fbtIndex} className="flex items-center gap-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200 shadow-sm">
                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                              <img
                                className="w-full h-full object-cover"
                                src={productImage}
                                alt={productName}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {productName}
                              </p>
                              {variantDisplay && variantDisplay.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {variantDisplay.map((attr, attrIndex) => (
                                    <span key={attrIndex} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                                      {attr}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs text-gray-600 mt-1">Quantity: {fbtItem.quantity}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-base font-bold text-indigo-600">
                                {formatCurrency(fbtItem.quantity * fbtItem.price)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                  </div>
                  
                  {/* Individual Discount Breakdown */}
                  {order.couponDiscount !== undefined && order.couponDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Coupon ({order.couponCode || 'N/A'}):</span>
                      <span className="text-green-600 font-medium">-{formatCurrency(order.couponDiscount)}</span>
                    </div>
                  )}
                  
                  {order.promoDiscount !== undefined && order.promoDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Promo Code ({order.promoCode || 'N/A'}):</span>
                      <span className="text-green-600 font-medium">-{formatCurrency(order.promoDiscount)}</span>
                    </div>
                  )}
                  
                  {order.giftVoucherDiscount !== undefined && order.giftVoucherDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Gift Voucher ({order.giftVoucherCode || 'N/A'}):</span>
                      <span className="text-green-600 font-medium">-{formatCurrency(order.giftVoucherDiscount)}</span>
                    </div>
                  )}
                  
               
                  
                  {order.rewardPointsDiscount !== undefined && order.rewardPointsDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Reward Points Discount:</span>
                      <span className="text-green-600 font-medium">-{formatCurrency(order.rewardPointsDiscount)}</span>
                    </div>
                  )}
                  
                  {order.shippingCharges !== undefined && order.shippingCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium">{formatCurrency(order.shippingCharges)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Details</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">{order.user.name}</p>
                    <p className="text-sm text-gray-600">{order.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-900">
                    {(() => {
                      // Prioritize address mobile
                      if (order.address.mobile && order.address.mobile.trim()) {
                        return order.address.mobile;
                      }
                      // Check if user.phone is a valid phone number (contains digits)
                      if (order.user.phone && /^\d/.test(order.user.phone.trim())) {
                        return order.user.phone;
                      }
                      return 'Not available';
                    })()}
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">{order.address.name}</p>
                    <p className="text-sm text-gray-600">{order.address.addressLine1}</p>
                    {order.address.addressLine2 && (
                      <p className="text-sm text-gray-600">{order.address.addressLine2}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      {order.address.city}, {order.address.state} {order.address.pincode}
                    </p>
                    <p className="text-sm text-gray-600">Phone: {order.address.mobile}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Actions */}
           
          </div>

          {/* Order Timeline */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Timeline</h2>
              <div className="space-y-4">
                {timeline.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 bg-blue-600 rounded-full mt-2"></div>
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-300 mx-auto mt-1"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.status}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(item.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Information */}
            <div className="card mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Order ID</p>
                  <p className="text-sm text-gray-900">#{order._id.slice(-6).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Order Date</p>
                  <p className="text-sm text-gray-900">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Payment Method</p>
                  <p className="text-sm text-gray-900">{order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Payment Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                    order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="card mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Actions</h2>
              <div className="space-y-4">
                {/* Status Update */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Current Status: 
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      statusColors[order.orderStatus]
                    }`}>
                      {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                    </span>
                  </label>
                  
                  {order.orderStatus === 'pending' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        onClick={() => updateOrderStatus('cancelled')}
                        className="btn-secondary w-full"
                        disabled={updating}
                      >
                        {updating ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Cancelling...
                          </div>
                        ) : (
                          'Cancel Order'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          // Direct redirect to shipment page for pending orders
                          router.push(`/orders/shipment?orderId=${orderId}`);
                        }}
                        className="btn-primary w-full"
                        disabled={updating}
                      >
                        Confirm Order
                      </button>
                    </div>
                  )}

                  {order.orderStatus === 'confirmed' && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tracking Number
                          </label>
                          <input
                            type="text"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="Enter tracking number"
                            className="input-field w-full"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimated Delivery Date
                          </label>
                          <input
                            type="date"
                            value={estimatedDelivery}
                            onChange={(e) => setEstimatedDelivery(e.target.value)}
                            className="input-field w-full"
                          />
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={updateTrackingInfo}
                          className="btn-primary w-full"
                          disabled={updating || !trackingNumber.trim()}
                        >
                          {updating ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Shipping...
                            </div>
                          ) : (
                            'Ship Order'
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {order.orderStatus === 'shipped' && (
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() => updateOrderStatus('delivered')}
                        className="btn-primary w-full"
                        disabled={updating}
                      >
                        {updating ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Marking as Delivered...
                          </div>
                        ) : (
                          'Mark as Delivered'
                        )}
                      </button>
                    </div>
                  )}

                  {order.orderStatus === 'delivered' && (
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() => updateOrderStatus('returned')}
                        className="btn-secondary w-full"
                        disabled={updating}
                      >
                        {updating ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing Return...
                          </div>
                        ) : (
                          'Process Return'
                        )}
                      </button>
                    </div>
                  )}

                  {order.trackingNumber && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Tracking Number:</p>
                          <p className="text-sm text-gray-600 font-mono">{order.trackingNumber}</p>
                        </div>
                        {order.estimatedDelivery && (
                          <div>
                            <p className="text-sm font-medium text-gray-900">Estimated Delivery:</p>
                            <p className="text-sm text-gray-600">{formatDate(order.estimatedDelivery)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* iThink Logistics Information - Only show for iThink Logistics, not Self Logistics */}
                  {order.logisticsSynced && order.logisticsType !== 'self' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-blue-900">iThink Logistics Integration</h3>
                      </div>
                      <div className="space-y-2">
                        {order.ithinkAwbNumber && (
                          <div>
                            <p className="text-sm font-medium text-blue-900">AWB Number:</p>
                            <p className="text-sm text-blue-700 font-mono">{order.ithinkAwbNumber}</p>
                          </div>
                        )}
                        {order.ithinkTrackingNumber && (
                          <div>
                            <p className="text-sm font-medium text-blue-900">iThink Tracking Number:</p>
                            <p className="text-sm text-blue-700 font-mono">{order.ithinkTrackingNumber}</p>
                          </div>
                        )}
                        {order.logisticsSyncedAt && (
                          <div>
                            <p className="text-sm font-medium text-blue-900">Synced At:</p>
                            <p className="text-sm text-blue-700">{formatDate(order.logisticsSyncedAt)}</p>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-700 font-medium">Automatically synced with iThink Logistics</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
