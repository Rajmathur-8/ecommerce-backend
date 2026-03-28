'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  InputLabel,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';

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
      shipmentLength?: number;
      shipmentWidth?: number;
      shipmentHeight?: number;
      shipmentWeight?: number;
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
    isFrequentlyBoughtTogether?: boolean;
  }>;
  shipmentDetails?: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
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
  returnDate?: string;
  createdAt: string;
  updatedAt: string;
}


interface ShipmentDetails {
  length: number;
  width: number;
  height: number;
  weight: number;
}

interface LogisticsOption {
  logistics: string;
  s_type: string;
  rate: number;
  delivery_tat: string;
  logistics_zone: string;
  prepaid: boolean;
  cod: boolean;
  pickup: boolean;
  rev_pickup: boolean;
  originalData: any;
}


export default function ShipmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState<ShipmentDetails>({
    length: 0,
    width: 0,
    height: 0,
    weight: 0
  });
  const [logisticsOptions, setLogisticsOptions] = useState<LogisticsOption[]>([]);
  const [selectedLogistics, setSelectedLogistics] = useState<LogisticsOption | null>(null);
  const [checkingRates, setCheckingRates] = useState(false);
  const [ratesChecked, setRatesChecked] = useState(false);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'gm'>('kg');
  const autoCheckTriggeredRef = useRef(false);
  const lastCheckedDetailsRef = useRef<string>('');
  const [isSelfLogistics, setIsSelfLogistics] = useState(false);
  const [showSelfLogisticsModal, setShowSelfLogisticsModal] = useState(false);
  const [selfLogisticsDetails, setSelfLogisticsDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [savedSelfLogistics, setSavedSelfLogistics] = useState<Array<{
    _id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  }>>([]);
  const [selectedSavedSelfLogistics, setSelectedSavedSelfLogistics] = useState<string>('');

  useEffect(() => {
    if (orderId) {
      // Reset states when order changes
      setRatesChecked(false);
      setLogisticsOptions([]);
      setSelectedLogistics(null);
      setCheckingRates(false);
      setShipmentDetails({ length: 0, width: 0, height: 0, weight: 0 });
      setIsSelfLogistics(false);
      setSelfLogisticsDetails({ name: '', email: '', phone: '', address: '' });
      setSelectedSavedSelfLogistics('');
      autoCheckTriggeredRef.current = false;
      lastCheckedDetailsRef.current = '';
      fetchOrderDetails();
    }
    fetchSavedSelfLogistics();
  }, [orderId]);

  const fetchSavedSelfLogistics = async () => {
    try {
      const response = await fetch(getApiUrl('/admin/self-logistics'), {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSavedSelfLogistics(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching saved self logistics:', error);
    }
  };

  const saveSelfLogistics = async () => {
    if (!selfLogisticsDetails.name.trim() || !selfLogisticsDetails.email.trim() || 
        !selfLogisticsDetails.phone.trim() || !selfLogisticsDetails.address.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    if (!selfLogisticsDetails.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch(getApiUrl('/admin/self-logistics'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selfLogisticsDetails),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save self logistics' }));
        toast.error(errorData.message || 'Failed to save self logistics');
        return;
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Self logistics details saved successfully');
        setShowSelfLogisticsModal(false);
        fetchSavedSelfLogistics();
        // Select the newly saved one
        if (data.data?._id) {
          setSelectedSavedSelfLogistics(data.data._id);
          setSelfLogisticsDetails(data.data);
        }
      } else {
        toast.error(data.message || 'Failed to save self logistics');
      }
    } catch (error: any) {
      console.error('Error saving self logistics:', error);
      toast.error('Failed to save self logistics');
    }
  };

  // Auto-fill shipment details when order is loaded (user can always edit)
  useEffect(() => {
    if (order) {
      let autoFilledDetails: ShipmentDetails | null = null;
      
      // Priority 1: If order already has shipment details, auto-fill them
      if (order.shipmentDetails && 
          order.shipmentDetails.length && 
          order.shipmentDetails.width && 
          order.shipmentDetails.height && 
          order.shipmentDetails.weight) {
        autoFilledDetails = {
          length: order.shipmentDetails.length,
          width: order.shipmentDetails.width,
          height: order.shipmentDetails.height,
          weight: order.shipmentDetails.weight
        };
        console.log('✅ Auto-filled shipment details from order:', order.shipmentDetails);
      }
      // Priority 2: If single product, try to fetch from product
      else if (order.items && order.items.length === 1 && order.items[0].product) {
        const product = order.items[0].product;
        if (product.shipmentLength && product.shipmentWidth && 
            product.shipmentHeight && product.shipmentWeight) {
          autoFilledDetails = {
            length: product.shipmentLength,
            width: product.shipmentWidth,
            height: product.shipmentHeight,
            weight: product.shipmentWeight * order.items[0].quantity
          };
          console.log('✅ Auto-filled shipment details from single product:', autoFilledDetails);
        } else {
          console.log('ℹ️ Single product but missing shipment details - user can fill manually');
        }
      } 
      // Priority 3: If multiple products, calculate combined shipment details
      else if (order.items && order.items.length > 1) {
        let maxLength = 0;
        let maxWidth = 0;
        let maxHeight = 0;
        let totalWeight = 0;
        let hasData = false;

        for (const item of order.items) {
          if (!item.isFrequentlyBoughtTogether && item.product && item.product.shipmentLength && item.product.shipmentWidth && 
              item.product.shipmentHeight && item.product.shipmentWeight) {
            maxLength = Math.max(maxLength, item.product.shipmentLength);
            maxWidth = Math.max(maxWidth, item.product.shipmentWidth);
            maxHeight = Math.max(maxHeight, item.product.shipmentHeight);
            totalWeight += (item.product.shipmentWeight * item.quantity);
            hasData = true;
          }
        }

        if (hasData && maxLength > 0 && maxWidth > 0 && maxHeight > 0 && totalWeight > 0) {
          autoFilledDetails = {
            length: maxLength,
            width: maxWidth,
            height: maxHeight,
            weight: totalWeight
          };
          console.log('✅ Auto-calculated combined shipment details from multiple products:', autoFilledDetails);
        } else {
          console.log('ℹ️ Multiple products but missing shipment details - user can fill manually');
        }
      }
      
      // Set shipment details if auto-filled
      if (autoFilledDetails) {
        setShipmentDetails(autoFilledDetails);
        // Reset checked details ref so auto-check useEffect can trigger
        lastCheckedDetailsRef.current = '';
      }
    }
  }, [order]);

  // Auto-check logistics rates whenever shipment details are complete
  useEffect(() => {
    // Only proceed if we have order
    if (!order) {
      return;
    }
    
    // Check if all shipment details are filled
    const isComplete = shipmentDetails.length > 0 && 
                       shipmentDetails.width > 0 && 
                       shipmentDetails.height > 0 && 
                       shipmentDetails.weight > 0;
    
    if (isComplete) {
      // Create a unique key for current details to avoid duplicate checks
      const detailsKey = `${shipmentDetails.length}-${shipmentDetails.width}-${shipmentDetails.height}-${shipmentDetails.weight}`;
      
      // Only check if details have changed or haven't been checked yet, and not currently checking
      if (lastCheckedDetailsRef.current !== detailsKey) {
        // Check if we're already checking rates
        if (checkingRates) {
          console.log('⏳ Already checking rates, skipping...');
          return;
        }
        
        lastCheckedDetailsRef.current = detailsKey;
        console.log('🔄 Auto-checking logistics rates for shipment details...', shipmentDetails);
        console.log('📦 Details key:', detailsKey);
        
        // Small delay to ensure state is settled and function is available
        const timer = setTimeout(() => {
          // Double check conditions before calling
          if (order && 
              shipmentDetails.length > 0 && 
              shipmentDetails.width > 0 && 
              shipmentDetails.height > 0 && 
              shipmentDetails.weight > 0) {
            console.log('✅ Calling checkLogisticsRates with:', shipmentDetails);
            checkLogisticsRates(shipmentDetails);
          } else {
            console.log('❌ Conditions not met for rate check');
          }
        }, 500);
        return () => clearTimeout(timer);
      } else {
        console.log('⏭️ Details already checked, skipping duplicate check');
      }
    } else {
      // Reset if details become incomplete
      if (lastCheckedDetailsRef.current !== '') {
        console.log('🔄 Resetting checked details - incomplete shipment details');
        lastCheckedDetailsRef.current = '';
      }
      if (ratesChecked) {
        setRatesChecked(false);
        setLogisticsOptions([]);
        setSelectedLogistics(null);
      }
    }
  }, [order, shipmentDetails.length, shipmentDetails.width, shipmentDetails.height, shipmentDetails.weight]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/admin/orders/${orderId}`), {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to load order details' }));
        toast.error(errorData.message || 'Failed to load order details. Please try again.');
        setOrder(null);
        return;
      }

      const data = await response.json();
      
      if (!data.success || !data.data?.order) {
        toast.error(data.message || 'Order not found or invalid data received.');
        setOrder(null);
        return;
      }

      setOrder(data.data.order);
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      const errorMessage = error?.message || 'Error loading order details. Please try again.';
      toast.error(errorMessage);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };



  const handleInputChange = (field: keyof ShipmentDetails, value: string | number) => {
    // Convert to number and handle empty string
    let numValue = value === '' ? 0 : Number(value);
    
    // If weight field and unit is gm, convert to kg for storage
    if (field === 'weight' && weightUnit === 'gm') {
      numValue = numValue / 1000; // Convert gm to kg (1kg = 1000gm)
    }
    
    const updatedDetails = { ...shipmentDetails, [field]: numValue };
    
    setShipmentDetails(updatedDetails);
    
    // Reset checked details ref when details change manually
    lastCheckedDetailsRef.current = '';
    
    // Check if all dimensions are filled and check rates automatically
    if (updatedDetails.length > 0 && updatedDetails.width > 0 && 
        updatedDetails.height > 0 && updatedDetails.weight > 0) {
      // Small delay to ensure state is updated, then useEffect will handle the check
      // This ensures we don't have duplicate calls
    } else {
      // Reset logistics options if dimensions are incomplete
      setLogisticsOptions([]);
      setSelectedLogistics(null);
      setRatesChecked(false);
    }
  };

  const handleWeightUnitChange = (newUnit: 'kg' | 'gm') => {
    if (newUnit === weightUnit) return;
    setWeightUnit(newUnit);
    // Weight is always stored in kg, so no conversion needed when changing display unit
  };

  // Get weight value for display based on selected unit
  const getDisplayWeight = () => {
    if (weightUnit === 'gm') {
      return shipmentDetails.weight === 0 ? '' : (shipmentDetails.weight * 1000).toFixed(2);
    }
    return shipmentDetails.weight === 0 ? '' : shipmentDetails.weight;
  };

  const checkLogisticsRates = async (details: ShipmentDetails) => {
    if (!order) return;
    
    setCheckingRates(true);
    try {
      const response = await fetch(getApiUrl('/web/logistics/rate-check'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_pincode: 834003, // Company pincode
          to_pincode: parseInt(order.address.pincode),
          shipping_length_cms: details.length,
          shipping_width_cms: details.width,
          shipping_height_cms: details.height,
          shipping_weight_kg: details.weight,
          order_type: "Forward",
          payment_method: order.paymentMethod === 'cod' ? "COD" : "Prepaid",
          product_mrp: order.total
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to check logistics rates' }));
        toast.error(errorData.message || 'Failed to check logistics rates. Please try again.');
        setLogisticsOptions([]);
        setRatesChecked(false);
        return;
      }

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || 'Failed to check logistics rates. Please try again.');
        setLogisticsOptions([]);
        setRatesChecked(false);
        return;
      }

      setLogisticsOptions(data.data?.logisticsOptions || []);
      setRatesChecked(true);
      
      if (data.data?.logisticsOptions && data.data.logisticsOptions.length > 0) {
        toast.success('Logistics rates checked successfully');
      } else {
        toast.warning('No logistics options available for the given dimensions and destination.');
      }
    } catch (error: any) {
      console.error('Error checking logistics rates:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Error checking logistics rates. Please try again.';
      toast.error(errorMessage);
      setLogisticsOptions([]);
      setRatesChecked(false);
    } finally {
      setCheckingRates(false);
    }
  };

  const handleLogisticsSelection = (option: LogisticsOption | null) => {
    if (!option) {
      setSelectedLogistics(null);
      setIsSelfLogistics(false);
      return;
    }
    
    setSelectedLogistics(prev => {
      // If same option is clicked, deselect it
      if (prev && prev.logistics === option.logistics && prev.s_type === option.s_type && prev.rate === option.rate) {
        setIsSelfLogistics(false);
        return null;
      }
      // Otherwise, select the new option
      setIsSelfLogistics(false);
      return option;
    });
  };

  const handleSelfLogisticsToggle = () => {
    if (isSelfLogistics) {
      setIsSelfLogistics(false);
      setSelectedLogistics(null);
      setSelectedSavedSelfLogistics('');
      setSelfLogisticsDetails({ name: '', email: '', phone: '', address: '' });
    } else {
      setIsSelfLogistics(true);
      setSelectedLogistics(null);
      setShowSelfLogisticsModal(true);
    }
  };

  const handleSelectSavedSelfLogistics = (id: string) => {
    const selected = savedSelfLogistics.find(item => item._id === id);
    if (selected) {
      setSelectedSavedSelfLogistics(id);
      setSelfLogisticsDetails({
        name: selected.name,
        email: selected.email,
        phone: selected.phone,
        address: selected.address
      });
    }
  };

  const calculateVolume = () => {
    if (!shipmentDetails.length || !shipmentDetails.width || !shipmentDetails.height || 
        shipmentDetails.length <= 0 || shipmentDetails.width <= 0 || shipmentDetails.height <= 0) {
      return '0.00';
    }
    return (shipmentDetails.length * shipmentDetails.width * shipmentDetails.height / 1000000).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show validation messages
    setShowValidation(true);
    
    // Validate shipment details
    if (!shipmentDetails.length || !shipmentDetails.width || 
        !shipmentDetails.height || !shipmentDetails.weight ||
        shipmentDetails.length <= 0 || shipmentDetails.width <= 0 || 
        shipmentDetails.height <= 0 || shipmentDetails.weight <= 0) {
      toast.error('Please enter valid shipment dimensions and weight');
      return;
    }

    // Validate logistics selection
    if (!isSelfLogistics && !selectedLogistics) {
      toast.error('Please select a logistics option');
      return;
    }

    // Validate self logistics details if self logistics is selected
    if (isSelfLogistics) {
      if (!selectedSavedSelfLogistics) {
        toast.error('Please select or add self logistics details');
        return;
      }
      if (!selfLogisticsDetails.name.trim() || !selfLogisticsDetails.email.trim() || 
          !selfLogisticsDetails.phone.trim() || !selfLogisticsDetails.address.trim()) {
        toast.error('Please fill all self logistics details');
        return;
      }
    }
    
    setSubmitting(true);
    try {
      // Step 1: Call add.json API with selected logistics option or self logistics
      const requestBody: any = {
        orderId,
        shipmentDetails: {
          length: shipmentDetails.length,
          width: shipmentDetails.width,
          height: shipmentDetails.height,
          weight: shipmentDetails.weight
        }
      };

      if (isSelfLogistics) {
        requestBody.isSelfLogistics = true;
        requestBody.selfLogisticsId = selectedSavedSelfLogistics;
        requestBody.selfLogisticsDetails = selfLogisticsDetails;
      } else {
        requestBody.selectedLogistics = selectedLogistics;
      }

      const addJsonResponse = await fetch(getApiUrl('/web/logistics/add-json'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!addJsonResponse.ok) {
        const errorData = await addJsonResponse.json().catch(() => ({ message: 'Failed to create shipment' }));
        toast.error(errorData.message || 'Failed to create shipment. Please try again.');
        return;
      }

      const addJsonData = await addJsonResponse.json();

      if (!addJsonData.success) {
        toast.error(addJsonData.message || 'Failed to create shipment. Please try again.');
        return;
      }

      console.log('✅ add.json API successful:', addJsonData);
      
      // Step 2: Update order status to confirmed (only for regular logistics)
      // For self logistics, order is already confirmed in backend
      if (!isSelfLogistics) {
        const confirmResponse = await fetch(getApiUrl(`/admin/orders/${orderId}/status`), {
          method: 'PUT',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderStatus: 'confirmed'
          }),
        });

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json().catch(() => ({ message: 'Failed to confirm order' }));
          toast.error(errorData.message || 'Shipment created but failed to confirm order. Please confirm manually.');
          return;
        }

        const confirmData = await confirmResponse.json();
        if (!confirmData.success) {
          toast.error(confirmData.message || 'Shipment created but failed to confirm order. Please confirm manually.');
          return;
        }

        console.log('✅ Order status updated to confirmed');
      } else {
        console.log('✅ Self logistics order already confirmed in backend');
      }

      // Step 3: Redirect to order details page
      toast.success(isSelfLogistics 
        ? 'Self logistics shipment created and order confirmed successfully!' 
        : 'Order confirmed successfully! You can now ship the order.');
      router.push(`/orders/details/${orderId}`);
    } catch (error: any) {
      console.error('Error processing shipment:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Error processing shipment. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: 'Orders', href: '/orders/all-orders' },
            { label: 'Create Shipment' }
          ]} />
          
          <div className="flex items-center justify-center min-h-96">
            <CircularProgress size={60} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Breadcrumbs items={[
            { label: 'Orders', href: '/orders/all-orders' },
            { label: 'Create Shipment' }
          ]} />
          
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
            <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
            <Button 
              variant="contained" 
              startIcon={<ArrowBack />}
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: 'Orders', href: '/orders/all-orders' },
          { label: `Order #${order._id.slice(-6).toUpperCase()}`, href: `/orders/details/${order._id}` },
          { label: 'Create Shipment' }
        ]} />
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Shipment</h1>
          <p className="text-gray-600 mt-1">Order #{order._id.slice(-6).toUpperCase()}</p>
        </div>

      <Grid container spacing={3}>
        {/* Order Details */}
        <Grid size={{xs: 12, md: 7}}>
          <Card>
            <CardHeader
              title={<Typography variant="h6">Order Details</Typography>}
            />
            <CardContent>
              <Stack spacing={3}>
                {/* Customer Details */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Customer
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">{order.user?.name || 'N/A'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.user?.email || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.user?.phone || 'N/A'}
                    </Typography>
                  </Stack>
                </Box>
                
                <Divider />
                
                {/* Delivery Address */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Delivery Address
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">{order.address?.name || 'N/A'}</Typography>
                    <Typography variant="body2">{order.address?.addressLine1 || 'N/A'}</Typography>
                    {order.address?.addressLine2 && (
                      <Typography variant="body2">
                        {order.address.addressLine2}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      {order.address?.city || 'N/A'}, {order.address?.state || 'N/A'} - {order.address?.pincode || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.address?.mobile || 'N/A'}
                    </Typography>
                  </Stack>
                </Box>

                <Divider />
                
                {/* Items */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Items
                  </Typography>
                  <Stack spacing={1}>
                    {order.items.filter((item) => !item.isFrequentlyBoughtTogether).map((item, index) => {
                      const productName = item.manualProduct?.productName || item.product?.productName || 'Product';
                      return (
                        <Box key={index} display="flex" justifyContent="space-between">
                          <Typography variant="body2">
                            {productName} (Qty: {item.quantity})
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ₹{item.price}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="subtitle2">Total</Typography>
                    <Typography variant="subtitle2" fontWeight="bold">
                      ₹{order.total}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Shipment Form */}
        <Grid size={{xs: 12, md: 5}}>
          <Card>
            <CardHeader
              title={<Typography variant="h6">Shipment Details</Typography>}
            />
            <CardContent>
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  {/* Dimensions */}
                  <Grid container spacing={2}>
                    <Grid size={{xs: 6}}>
                      <TextField
                        label="Length (cm)"
                        type="number"
                        inputProps={{ step: 0.1, min: 0 }}
                        value={shipmentDetails.length === 0 ? '' : shipmentDetails.length}
                        onChange={(e) => handleInputChange('length', e.target.value)}
                        required
                        fullWidth
                        error={showValidation && shipmentDetails.length <= 0}
                        helperText={showValidation && shipmentDetails.length <= 0 ? "Length must be greater than 0" : ""}
                        placeholder="Enter length"
                      />
                    </Grid>
                    <Grid size={{xs: 6}}>
                      <TextField
                        label="Width (cm)"
                        type="number"
                        inputProps={{ step: 0.1, min: 0 }}
                        value={shipmentDetails.width === 0 ? '' : shipmentDetails.width}
                        onChange={(e) => handleInputChange('width', e.target.value)}
                        required
                        fullWidth
                        error={showValidation && shipmentDetails.width <= 0}
                        helperText={showValidation && shipmentDetails.width <= 0 ? "Width must be greater than 0" : ""}
                        placeholder="Enter width"
                      />
                    </Grid>
                    <Grid size={{xs: 6}}>
                      <TextField
                        label="Height (cm)"
                        type="number"
                        inputProps={{ step: 0.1, min: 0 }}
                        value={shipmentDetails.height === 0 ? '' : shipmentDetails.height}
                        onChange={(e) => handleInputChange('height', e.target.value)}
                        required
                        fullWidth
                        error={showValidation && shipmentDetails.height <= 0}
                        helperText={showValidation && shipmentDetails.height <= 0 ? "Height must be greater than 0" : ""}
                        placeholder="Enter height"
                      />
                    </Grid>
                    <Grid size={{xs: 6}}>
                      <Box>
                        <TextField
                          label={`Weight (${weightUnit})`}
                          type="number"
                          inputProps={{ step: weightUnit === 'kg' ? 0.1 : 1, min: 0 }}
                          value={getDisplayWeight()}
                          onChange={(e) => handleInputChange('weight', e.target.value)}
                          required
                          fullWidth
                          error={showValidation && shipmentDetails.weight <= 0}
                          helperText={showValidation && shipmentDetails.weight <= 0 ? "Weight must be greater than 0" : ""}
                          placeholder={`Enter weight in ${weightUnit}`}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Select
                                  value={weightUnit}
                                  onChange={(e) => handleWeightUnitChange(e.target.value as 'kg' | 'gm')}
                                  sx={{ 
                                    minWidth: 60,
                                    '& .MuiSelect-select': {
                                      py: 0.5,
                                      px: 1
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      border: 'none'
                                    }
                                  }}
                                >
                                  <MenuItem value="kg">kg</MenuItem>
                                  <MenuItem value="gm">gm</MenuItem>
                                </Select>
                              </InputAdornment>
                            )
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          1 kg = 1000 gm
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Volume Display */}
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'grey.50',
                      border: '1px solid',
                      borderColor: 'grey.300',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary">
                      Calculated Volume: <Typography component="span" variant="subtitle2" fontWeight="bold" color="text.primary">
                        {calculateVolume()} m³
                      </Typography>
                    </Typography>
                    {showValidation && (shipmentDetails.length <= 0 || shipmentDetails.width <= 0 || shipmentDetails.height <= 0) && (
                      <Typography variant="caption" color="error.main" display="block" sx={{ mt: 1 }}>
                        Please enter valid dimensions to calculate volume
                      </Typography>
                    )}
                  </Paper>

                  {/* Rate Check Status */}
                  {checkingRates && (
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="text.secondary">
                          Checking logistics rates...
                        </Typography>
                      </Box>
                    </Paper>
                  )}

                  {/* Logistics Options */}
                  {(ratesChecked && logisticsOptions.length > 0) || shipmentDetails.length > 0 ? (
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'white', border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                      <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight="bold">
                        Available Logistics Options
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Select your preferred shipping partner:
                      </Typography>
                      <FormControl component="fieldset" fullWidth>
                        <RadioGroup
                          value={isSelfLogistics ? 'self-logistics' : (selectedLogistics ? `${selectedLogistics.logistics}-${selectedLogistics.s_type}-${selectedLogistics.rate}` : '')}
                          onChange={(e) => {
                            if (e.target.value === 'self-logistics') {
                              handleSelfLogisticsToggle();
                            } else {
                              const [logistics, s_type, rate] = e.target.value.split('-');
                              const option = logisticsOptions.find(opt => 
                                opt.logistics === logistics && 
                                opt.s_type === s_type && 
                                opt.rate.toString() === rate
                              );
                              handleLogisticsSelection(option || null);
                            }
                          }}
                        >
                          {/* Self Logistics Option */}
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              mb: 1,
                              border: '1px solid',
                              borderColor: isSelfLogistics ? 'primary.main' : 'grey.300',
                              borderRadius: 1,
                              bgcolor: isSelfLogistics ? 'grey.100' : 'white',
                              cursor: 'pointer',
                              '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: 'grey.50'
                              }
                            }}
                          >
                            <FormControlLabel
                              value="self-logistics"
                              control={<Radio />}
                              label={
                                <Box sx={{ ml: 1 }}>
                                  <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                                    Self Logistics
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Ship the order yourself
                                  </Typography>
                                </Box>
                              }
                              sx={{ margin: 0, width: '100%' }}
                            />
                          </Paper>

                          {/* Other Logistics Options */}
                          {logisticsOptions.map((option, index) => (
                            <Paper
                              key={index}
                              elevation={0}
                              sx={{
                                p: 2,
                                mb: 1,
                                border: '1px solid',
                                borderColor: selectedLogistics && selectedLogistics.logistics === option.logistics && selectedLogistics.s_type === option.s_type 
                                  ? 'primary.main' 
                                  : 'grey.300',
                                borderRadius: 1,
                                bgcolor: selectedLogistics && selectedLogistics.logistics === option.logistics && selectedLogistics.s_type === option.s_type 
                                  ? 'grey.100' 
                                  : 'white',
                                cursor: 'pointer',
                                '&:hover': {
                                  borderColor: 'primary.main',
                                  bgcolor: 'grey.50'
                                }
                              }}
                            >
                              <FormControlLabel
                                value={`${option.logistics}-${option.s_type}-${option.rate}`}
                                control={<Radio />}
                                label={
                                  <Box sx={{ ml: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                                      {option.logistics} - {option.s_type}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        Rate: <strong>₹{option.rate}</strong>
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        TAT: <strong>{option.delivery_tat} days</strong>
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        Zone: <strong>{option.logistics_zone}</strong>
                                      </Typography>
                                    </Box>
                                  </Box>
                                }
                                sx={{ margin: 0, width: '100%' }}
                              />
                            </Paper>
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </Paper>
                  ) : null}

                  {ratesChecked && logisticsOptions.length === 0 && !isSelfLogistics && (
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.300' }}>
                      <Typography variant="body2" color="text.secondary">
                        No logistics options available for the given dimensions and destination.
                      </Typography>
                    </Paper>
                  )}

                  {/* Self Logistics Selection */}
                  {isSelfLogistics && (
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'white', border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                      <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight="bold">
                        Self Logistics
                      </Typography>
                      <Stack spacing={2}>
                        {savedSelfLogistics.length > 0 && (
                          <FormControl fullWidth>
                            <InputLabel>Select Saved Self Logistics</InputLabel>
                            <Select
                              value={selectedSavedSelfLogistics}
                              onChange={(e) => handleSelectSavedSelfLogistics(e.target.value)}
                              label="Select Saved Self Logistics"
                            >
                              {savedSelfLogistics.map((item) => (
                                <MenuItem key={item._id} value={item._id}>
                                  {item.name} - {item.email}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setSelfLogisticsDetails({ name: '', email: '', phone: '', address: '' });
                            setShowSelfLogisticsModal(true);
                          }}
                          fullWidth
                        >
                          {savedSelfLogistics.length > 0 ? 'Add New Self Logistics' : 'Add Self Logistics Details'}
                        </Button>
                        {selectedSavedSelfLogistics && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Selected:</strong> {selfLogisticsDetails.name} - {selfLogisticsDetails.email}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Paper>
                  )}


                  {/* Action Buttons */}
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => router.push(`/orders/details/${orderId}`)}
                      fullWidth
                      sx={{ 
                        textTransform: 'none',
                        borderColor: 'grey.400',
                        color: 'grey.600',
                        '&:hover': { 
                          borderColor: 'grey.600',
                          bgcolor: 'grey.50'
                        }
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={submitting || (!isSelfLogistics && (!selectedLogistics || !ratesChecked || logisticsOptions.length === 0)) || (isSelfLogistics && !selectedSavedSelfLogistics)}
                      startIcon={submitting && <CircularProgress size={20} color="inherit" />}
                      fullWidth
                      sx={{
                        textTransform: 'none',
                        bgcolor: (isSelfLogistics || (selectedLogistics && ratesChecked && logisticsOptions.length > 0)) ? 'primary.main' : 'grey.400',
                        '&:hover': {
                          bgcolor: (isSelfLogistics || (selectedLogistics && ratesChecked && logisticsOptions.length > 0)) ? 'primary.dark' : 'grey.500'
                        },
                        '&:disabled': {
                          bgcolor: 'grey.400',
                          color: 'grey.600'
                        }
                      }}
                    >
                      {submitting ? 'Processing...' : isSelfLogistics ? 'Create Shipment (Self Logistics)' : selectedLogistics ? 'Create Shipment' : (ratesChecked && logisticsOptions.length > 0) ? 'Select Logistics' : 'Fill Details'}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Self Logistics Modal */}
      <Dialog 
        open={showSelfLogisticsModal} 
        onClose={() => setShowSelfLogisticsModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Self Logistics Details</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={selfLogisticsDetails.name}
              onChange={(e) => setSelfLogisticsDetails(prev => ({ ...prev, name: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={selfLogisticsDetails.email}
              onChange={(e) => setSelfLogisticsDetails(prev => ({ ...prev, email: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Phone Number"
              type="tel"
              value={selfLogisticsDetails.phone}
              onChange={(e) => setSelfLogisticsDetails(prev => ({ ...prev, phone: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Address"
              multiline
              rows={3}
              value={selfLogisticsDetails.address}
              onChange={(e) => setSelfLogisticsDetails(prev => ({ ...prev, address: e.target.value }))}
              required
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSelfLogisticsModal(false)}>
            Cancel
          </Button>
          <Button 
            onClick={saveSelfLogistics} 
            variant="contained"
            disabled={!selfLogisticsDetails.name.trim() || !selfLogisticsDetails.email.trim() || 
                     !selfLogisticsDetails.phone.trim() || !selfLogisticsDetails.address.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}

