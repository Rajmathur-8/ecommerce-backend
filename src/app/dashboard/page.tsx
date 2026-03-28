'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Eye,
  Star,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Bell,
  BarChart3,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Settings,
  Filter,
  Download,
  MoreHorizontal,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AlertCircle,
  Info,
  CheckCircle2,

  CreditCard,
  Truck,
  Tag,
  Percent,
  TrendingUp as TrendingUpIcon2,
  ShoppingBag,
  UserPlus,
  PackageCheck,
  AlertOctagon,
  Clock as ClockIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Minus,
  Plus
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { DashboardSkeleton } from '@/components/Skeleton';
import { getApiUrl, getAuthHeaders, apiCall, formatCurrency, formatNumber } from '@/lib/config';
import { useMultipleApiWithLoading } from '@/lib/apiUtils';
import Link from 'next/link';
import RechartsBarChart from '@/components/RechartsBarChart';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
  currentMonthRevenue: number;
  currentMonthOrders: number;
  currentMonthCustomers: number;
  currentMonthProducts: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
  };
  totalAmount: number;
  status: string;
  createdAt: string;
  items: Array<{
    product: {
      productName: string;
    };
    quantity: number;
  }>;
}

interface TopProduct {
  _id: string;
  productName: string;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
  totalOrders: number;
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

interface DashboardAlert {
  type: string;
  title: string;
  message: string;
  severity: 'success' | 'warning' | 'error' | 'info';
  count: number;
  products?: Array<{
    id: string;
    name: string;
    stock: number;
  }>;
}

interface ActiveUsersData {
  date: string;
  activeUsers: number;
  newUsers: number;
}

interface ActiveUsersSummary {
  totalUsers: number;
  activeLast15Days: number;
  activeLast7Days: number;
  activeThisMonth: number;
  totalNewUsers: number;
  averageDailyOrders: number;
  currentActiveUsers: number;
  activeDaysSetting?: number;
  weeklyActiveDaysSetting?: number;
}

interface PerformanceMetrics {
  averageOrderValue: number;
  customerRetentionRate: number;
  conversionRate: number;
  inventoryHealth: number;
  totalCustomers: number;
  totalOrders: number;
  totalProducts: number;
  lowStockProducts: number;
}

interface ActivityItem {
  type: 'order' | 'customer' | 'product';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [inventoryStatus, setInventoryStatus] = useState<{
    inStock: number;
    lowStock: number;
    outOfStock: number;
    fastMoving: number;
  } | null>(null);
  const [activeUsersData, setActiveUsersData] = useState<ActiveUsersData[]>([]);
  const [activeUsersSummary, setActiveUsersSummary] = useState<ActiveUsersSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [selectedUsersPeriod, setSelectedUsersPeriod] = useState('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeUsersList, setActiveUsersList] = useState<Array<{
    _id: string;
    name: string;
    email: string;
    phone?: string;
    lastOrderDate?: string;
    totalOrders?: number;
    isGuest?: boolean;
  }>>([]);
  const [activeUsersTab, setActiveUsersTab] = useState<'chart' | 'list'>('chart');
  const [activeUsersPage, setActiveUsersPage] = useState(1);
  const [activeUsersTotal, setActiveUsersTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data from APIs
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all dashboard data in parallel using the new API interceptor
        const [
          statsResult,
          ordersResult,
          productsResult,
          salesResult,
          performanceResult,
          inventoryResult,
          activeUsersResult
        ] = await Promise.all([
          apiCall('/admin/dashboard/stats'),
          apiCall('/admin/dashboard/recent-orders'),
          apiCall('/admin/dashboard/top-products'),
          apiCall(`/admin/dashboard/sales-chart?period=${selectedPeriod}`),
          apiCall('/admin/dashboard/performance'),
          apiCall('/admin/dashboard/inventory-status'),
          apiCall(selectedUsersPeriod === 'custom' && startDate && endDate 
            ? `/admin/dashboard/active-users?startDate=${startDate}&endDate=${endDate}&page=${activeUsersPage}&limit=10`
            : `/admin/dashboard/active-users?period=${selectedUsersPeriod}&page=${activeUsersPage}&limit=10`)
        ]);

        // Set data if successful
        if (statsResult.data.success) setStats(statsResult.data.data);
        if (ordersResult.data.success) setRecentOrders(ordersResult.data.data || []);
        if (productsResult.data.success) setTopProducts(productsResult.data.data || []);
        if (salesResult.data.success) setSalesData(salesResult.data.data || []);
        if (performanceResult.data.success) setPerformanceMetrics(performanceResult.data.data);
        if (inventoryResult.data.success) {
          // Transform inventory data to match frontend format
          const inventory = inventoryResult.data.data;
          setInventoryStatus({
            inStock: inventory.inStock.count,
            lowStock: inventory.lowStock.count,
            outOfStock: inventory.outOfStock.count,
            fastMoving: inventory.fastMoving.count
          });
        }
        if (activeUsersResult.data.success) {
          setActiveUsersData(activeUsersResult.data.data.users || []);
          setActiveUsersSummary(activeUsersResult.data.data.summary);
          setActiveUsersList(activeUsersResult.data.data.activeUsersList || []);
          setActiveUsersTotal(activeUsersResult.data.data.totalActiveUsers || 0);
        }

        console.log("statsResult.data",statsResult.data)
        console.log("ordersResult.data",ordersResult.data)
        console.log("productsResult.data",productsResult.data)
        console.log("performanceResult.data",performanceResult.data)
        console.log("inventoryResult.data",inventoryResult.data)
        console.log("activeUsersResult.data",activeUsersResult.data)

      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedPeriod, selectedUsersPeriod, startDate, endDate, activeUsersPage]);


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    if (!status) return <Clock className="w-4 h-4" />;
    
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'shipped':
        return <Activity className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-4 h-4 text-blue-500" />;
      case 'customer':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'product':
        return <Package className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading || !stats) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }



  return (

    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your store today.</p>
        </div>



        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalRevenue)}</p>
                <div className="flex items-center mt-2">
                  {stats.revenueChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ml-1 ${
                    stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.revenueChange >= 0 ? '+' : ''}{stats?.revenueChange?.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats.totalOrders)}</p>
                <div className="flex items-center mt-2">
                  {stats.ordersChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ml-1 ${
                    stats.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.ordersChange >= 0 ? '+' : ''}{stats?.ordersChange?.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Total Customers */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats?.totalCustomers || 0)}</p>
                <div className="flex items-center mt-2">
                  {stats.customersChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ml-1 ${
                    stats.customersChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.customersChange >= 0 ? '+' : ''}{stats?.customersChange?.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Total Products */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats?.totalProducts || 0)}</p>
                <div className="flex items-center mt-2">
                  {stats.productsChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ml-1 ${
                    stats.productsChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.productsChange >= 0 ? '+' : ''}{stats?.productsChange?.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {performanceMetrics && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Performance Metrics</span>
              </h2>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">This month</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(performanceMetrics.averageOrderValue)}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">Customer Retention</p>
                <p className="text-2xl font-bold text-gray-900">{performanceMetrics.customerRetentionRate.toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{performanceMetrics.conversionRate.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-8 h-8 text-orange-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">Inventory Health</p>
                <p className="text-2xl font-bold text-gray-900">{performanceMetrics.inventoryHealth.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Active Users Analytics */}
        {activeUsersSummary && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Active Users</span>
              </h2>
              <div className="flex items-center space-x-3">
                <select 
                  value={selectedUsersPeriod} 
                  onChange={(e) => {
                    setSelectedUsersPeriod(e.target.value);
                    if (e.target.value !== 'custom') {
                      setStartDate('');
                      setEndDate('');
                    }
                  }}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1"
                >
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                  <option value="custom">Custom Date</option>
                </select>
                {selectedUsersPeriod === 'custom' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Users</p>
                    <p className="text-2xl font-bold text-blue-900">{formatNumber(activeUsersSummary.totalUsers)}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">
                      Active (Last {activeUsersSummary.activeDaysSetting || 15} Days)
                    </p>
                    <p className="text-2xl font-bold text-green-900">{formatNumber(activeUsersSummary.activeLast15Days)}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {activeUsersSummary.totalUsers > 0 ? 
                        `${Math.round((activeUsersSummary.activeLast15Days / activeUsersSummary.totalUsers) * 100)}% of total` 
                        : '0%'}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">
                      Active (Last {activeUsersSummary.weeklyActiveDaysSetting || 7} Days)
                    </p>
                    <p className="text-2xl font-bold text-purple-900">{formatNumber(activeUsersSummary.activeLast7Days)}</p>
                    <p className="text-xs text-purple-600 mt-1">Weekly active</p>
                  </div>
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">New Users (Period)</p>
                    <p className="text-2xl font-bold text-orange-900">{formatNumber(activeUsersSummary.totalNewUsers)}</p>
                    <p className="text-xs text-orange-600 mt-1">
                      Avg {activeUsersSummary.averageDailyOrders} orders/day
                    </p>
                  </div>
                  <UserPlus className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Tabs for Chart and List */}
            <div className="mt-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveUsersTab('chart')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeUsersTab === 'chart'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    Chart
                  </button>
                  <button
                    onClick={() => {
                      setActiveUsersTab('list');
                      setActiveUsersPage(1); // Reset to first page when switching to list tab
                    }}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeUsersTab === 'list'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Users className="w-4 h-4 inline mr-2" />
                    Active Users List
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="mt-6">
                {activeUsersTab === 'chart' ? (
                  <div>
                    {activeUsersData.length > 0 ? (
                      <div className="w-full">
                        <RechartsBarChart 
                          data={activeUsersData.map(d => ({
                            date: d.date,
                            activeUsers: d.activeUsers,
                            newUsers: d.newUsers
                          }))}
                          type="users"
                          height={350}
                          color="#10B981"
                        />
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-center space-x-6">
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                              <span className="text-sm text-gray-600">
                                Active Users ({activeUsersSummary.activeDaysSetting || 15}-day rolling)
                              </span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
                              <span className="text-sm text-gray-600">New Users</span>
                            </div>
                          </div>
                          <p className="text-xs text-center text-gray-500 italic">
                            * Active Users = Users who ordered in last {activeUsersSummary.activeDaysSetting || 15} days from that date
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Users className="w-12 h-12 mx-auto mb-2" />
                        <p>No active users data available</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {activeUsersList.length > 0 ? (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Phone</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Total Orders</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Last Order</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeUsersList.map((user) => {
                                // Check if user is guest
                                const isGuest = user.isGuest || user.email?.includes('@guest.com') || user.email?.startsWith('guest_');
                                const displayName = isGuest ? 'Guest' : (user.name || 'N/A');
                                
                                return (
                                <tr key={user._id} className="border-b hover:bg-gray-50">
                                  <td className="py-3 px-4">
                                    <p className="font-medium text-gray-900">{displayName}</p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="text-gray-600">{user.email}</p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="text-gray-600">{user.phone || 'N/A'}</p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="text-gray-900">{formatNumber(user.totalOrders || 0)}</p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="text-gray-600">
                                      {user.lastOrderDate ? formatDate(user.lastOrderDate) : 'N/A'}
                                    </p>
                                  </td>
                                </tr>
                              );
                              })}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Pagination */}
                        {activeUsersTotal > 10 && (
                          <div className="flex items-center justify-between mt-6 pt-4 border-t">
                            <p className="text-sm text-gray-600">
                              Showing {((activeUsersPage - 1) * 10) + 1} to {Math.min(activeUsersPage * 10, activeUsersTotal)} of {formatNumber(activeUsersTotal)} users
                            </p>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setActiveUsersPage(prev => Math.max(1, prev - 1))}
                                disabled={activeUsersPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Previous
                              </button>
                              <span className="px-3 py-1 text-sm">
                                Page {activeUsersPage} of {Math.ceil(activeUsersTotal / 10)}
                              </span>
                              <button
                                onClick={() => setActiveUsersPage(prev => Math.min(Math.ceil(activeUsersTotal / 10), prev + 1))}
                                disabled={activeUsersPage >= Math.ceil(activeUsersTotal / 10)}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Users className="w-12 h-12 mx-auto mb-2" />
                        <p>No active users found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <div className="card flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Sales Overview</span>
              </h2>
              <div className="flex items-center space-x-2">
                <select 
                  value={selectedPeriod} 
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1"
                >
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                </select>
              </div>
            </div>
            <div className="flex-1">
              {salesData.length > 0 ? (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1">
                    <RechartsBarChart 
                      data={salesData} 
                      type="revenue" 
                      height={400} 
                      color="#3B82F6"
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Total Revenue: {formatCurrency(salesData.reduce((sum, data) => sum + data.revenue, 0))}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 h-full flex items-center justify-center">
                  <div>
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p>No sales data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
              <Link href="/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1">
                <span>View All</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4 flex-1">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getStatusIcon(order.status || 'pending')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{order.orderNumber || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{order.customer?.name || 'Unknown Customer'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(order.totalAmount || 0)}</p>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status || 'pending')}`}>
                        {order.status || 'pending'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent orders</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Top Products</h2>
            <Link href="/products" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1">
              <span>View All</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={product._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.productName || 'Unknown Product'}</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(product.averageRating || 0) 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">({(product.averageRating || 0).toFixed(1)})</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(product.totalRevenue || 0)}</p>
                    <p className="text-sm text-gray-600">{product.totalSales || 0} sales</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No products data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Overview */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Inventory Status</span>
            </h2>
            <Link href="/products" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1">
              <span>View All Products</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">In Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{inventoryStatus?.inStock || 0}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {inventoryStatus ? Math.round((inventoryStatus.inStock / Math.max(1, inventoryStatus.inStock + inventoryStatus.lowStock + inventoryStatus.outOfStock)) * 100) : 0}% of total products
              </p>
            </div>
            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{inventoryStatus?.lowStock || 0}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {inventoryStatus ? Math.round((inventoryStatus.lowStock / Math.max(1, inventoryStatus.inStock + inventoryStatus.lowStock + inventoryStatus.outOfStock)) * 100) : 0}% of total products
              </p>
            </div>
            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{inventoryStatus?.outOfStock || 0}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {inventoryStatus ? Math.round((inventoryStatus.outOfStock / Math.max(1, inventoryStatus.inStock + inventoryStatus.lowStock + inventoryStatus.outOfStock)) * 100) : 0}% of total products
              </p>
            </div>
            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Fast Moving</p>
                  <p className="text-2xl font-bold text-gray-900">{inventoryStatus?.fastMoving || 0}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">High demand items</p>
            </div>
          </div>
        </div>


      </div>
    </DashboardLayout>
  
   
  );
}

