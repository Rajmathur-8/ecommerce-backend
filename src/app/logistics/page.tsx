'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useState, useEffect, useCallback } from 'react';
import { getApiUrl, getAuthHeaders } from '../../lib/config';
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Globe,
  Users,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface LogisticsStats {
  totalDeliveries: number;
  activeDeliveries: number;
  deliveredToday: number;
  orderPlaced: number;
  pendingPickup: number;
  inTransit: number;
  outForDelivery: number;
  averageDeliveryTime: number;
  successRate: number;
}

export default function LogisticsPage() {
  const [stats, setStats] = useState<LogisticsStats>({
    totalDeliveries: 0,
    activeDeliveries: 0,
    deliveredToday: 0,
    orderPlaced: 0,
    pendingPickup: 0,
    inTransit: 0,
    outForDelivery: 0,
    averageDeliveryTime: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch logistics stats
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl('/admin/logistics/stats')}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    {
      title: 'Total Deliveries',
      value: stats.totalDeliveries,
      icon: Package,
      color: 'blue',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Active Deliveries',
      value: stats.activeDeliveries,
      icon: Truck,
      color: 'green',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Delivered Today',
      value: stats.deliveredToday,
      icon: CheckCircle,
      color: 'orange',
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ];

  const statusCards = [
    {
      title: 'Orders Placed',
      value: stats.orderPlaced,
      icon: Package,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500'
    },
    {
      title: 'Pending Pickup',
      value: stats.pendingPickup,
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-500'
    },
    {
      title: 'In Transit',
      value: stats.inTransit,
      icon: Truck,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500'
    },
    {
      title: 'Out for Delivery',
      value: stats.outForDelivery,
      icon: MapPin,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-500'
    }
  ];

  const quickActions = [
    {
      title: 'Shipping Partners',
      description: 'View and sync shipping partners from iThink Logistics',
      icon: Truck,
      href: '/logistics/partners',
      color: 'blue'
    },
    {
      title: 'Track Deliveries',
      description: 'Monitor all deliveries from iThink Logistics',
      icon: Package,
      href: '/logistics/deliveries',
      color: 'green'
    },
    {
      title: 'Delivery Analytics',
      description: 'View performance metrics and reports',
      icon: BarChart3,
      href: '/logistics/analytics',
      color: 'purple'
    },
    {
      title: 'Delivery Boys',
      description: 'Manage delivery personnel',
      icon: Users,
      href: '/logistics/delivery-boys',
      color: 'orange'
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <Breadcrumbs items={[
          { label: 'Logistics' }
        ]} />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Logistics Dashboard</h1>
              <p className="text-gray-600 mt-2">Monitor your delivery operations and track shipments from iThink Logistics</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Globe className="w-4 h-4 mr-2" />
                Export Report
              </button>
              <Link 
                href="/logistics/deliveries"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Package className="w-4 h-4 mr-2" />
                View All Deliveries
              </Link>
            </div>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className={`p-3 ${card.bgColor} rounded-lg`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : card.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Overview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Status Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statusCards.map((card, index) => (
              <div key={index} className="text-center">
                <div className={`inline-flex p-3 ${card.bgColor} rounded-lg mb-3`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : card.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 bg-${action.color}-100 rounded-lg group-hover:bg-${action.color}-200 transition-colors`}>
                    <action.icon className={`w-6 h-6 text-${action.color}-600`} />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <Link 
              href="/logistics/deliveries"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="animate-pulse flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
              <p className="text-gray-500 mb-6">Recent delivery updates from iThink Logistics will appear here</p>
              <Link 
                href="/logistics/deliveries"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Package className="w-4 h-4 mr-2" />
                View Deliveries
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
