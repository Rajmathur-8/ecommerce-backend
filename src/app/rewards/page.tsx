'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { 
  Gift, 
  Users, 
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { apiCall } from '@/lib/config';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface RewardAnalytics {
  summary: {
    totalUsersWithRewards: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    totalActivePoints: number;
    totalExpiredPoints: number;
    totalRedeemedPoints: number;
    averagePointsPerUser: number;
  };
  userRewardDetails: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    totalEarned: number;
    totalRedeemed: number;
    currentActivePoints: number;
    expiredPoints: number;
    redeemedPoints: number;
    totalEntries: number;
    activeEntriesCount: number;
    expiredEntriesCount: number;
    redeemedEntriesCount: number;
    earliestExpiry: string | null;
    lastEarned: string | null;
    entries: Array<{
      orderId: string;
      points: number;
      orderAmount: number;
      expiryDate: string;
      isActive: boolean;
      isExpired: boolean;
      isRedeemed: boolean;
    }>;
  }>;
  expiredPointsDetails: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    orderId: string;
    points: number;
    orderAmount: number;
    expiryDate: string;
    daysExpired: number;
  }>;
  expiringSoonDetails: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    orderId: string;
    points: number;
    orderAmount: number;
    expiryDate: string;
    daysUntilExpiry: number;
  }>;
  topUsersByPoints: Array<any>;
  recentActivities: Array<any>;
}

export default function RewardManagementPage() {
  const [analytics, setAnalytics] = useState<RewardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'expired' | 'expiring' | 'activities'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Reset page when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/admin/rewards/analytics');
      if (response.data.success) {
        setAnalytics(response.data.data);
      } else {
        toast.error('Failed to load reward analytics');
      }
    } catch (error) {
      toast.error('Failed to load reward analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredUsers = analytics?.userRewardDetails.filter(user =>
    user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.userPhone.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredExpired = analytics?.expiredPointsDetails.filter(item =>
    item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredExpiring = analytics?.expiringSoonDetails.filter(item =>
    item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Pagination calculations
  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'users':
        return filteredUsers;
      case 'expired':
        return filteredExpired;
      case 'expiring':
        return filteredExpiring;
      case 'activities':
        return analytics?.recentActivities || [];
      default:
        return [];
    }
  };

  const currentTabData = getCurrentTabData();
  const totalItems = currentTabData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = currentTabData.slice(startIndex, endIndex);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">No reward data available</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumbs items={[{ label: 'Reward Management' }]} />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Reward Management</h1>
          <p className="text-gray-600 mt-2">Track user rewards, expired points, and reward activities</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Users with Rewards</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {analytics.summary.totalUsersWithRewards}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Points Earned</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {analytics.summary.totalPointsEarned.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Points</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {analytics.summary.totalActivePoints.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Expired: {analytics.summary.totalExpiredPoints.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Points Redeemed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {analytics.summary.totalPointsRedeemed.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg: {analytics.summary.averagePointsPerUser} per user
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'users', name: 'Users', count: analytics.userRewardDetails.length },
                { id: 'expired', name: 'Expired Points', count: analytics.expiredPointsDetails.length },
                { id: 'expiring', name: 'Expiring Soon', count: analytics.expiringSoonDetails.length },
                { id: 'activities', name: 'Recent Activities', count: analytics.recentActivities.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span>{tab.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                {totalItems > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Earned</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Points</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expired Points</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Redeemed</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entries</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Earliest Expiry</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedData.map((user: any) => (
                          <tr key={user.userId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                              <div className="text-sm text-gray-500">{user.userEmail}</div>
                              <div className="text-xs text-gray-400">{user.userPhone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user.totalEarned.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-green-600">
                                {user.currentActivePoints.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-red-600">
                                {user.expiredPoints.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-600">
                                {user.redeemedPoints.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div>Active: {user.activeEntriesCount}</div>
                                <div className="text-xs text-gray-500">
                                  Expired: {user.expiredEntriesCount} | Redeemed: {user.redeemedEntriesCount}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {formatDate(user.earliestExpiry)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Link
                                href={`/rewards/user/${user.userId}`}
                                className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No users found</p>
                  </div>
                )}
              </div>
            )}

            {/* Expired Points Tab */}
            {activeTab === 'expired' && (
              <div className="space-y-4">
                {totalItems > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Expired</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedData.map((item: any, index: number) => (
                          <tr key={`${item.userId}-${item.orderId}-${index}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.userName}</div>
                              <div className="text-sm text-gray-500">{item.userEmail}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.orderId.toString().slice(-8)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-red-600">
                                {item.points.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">₹{item.orderAmount.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{formatDate(item.expiryDate)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-red-600">
                                {item.daysExpired} days
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <XCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No expired points found</p>
                  </div>
                )}
              </div>
            )}

            {/* Expiring Soon Tab */}
            {activeTab === 'expiring' && (
              <div className="space-y-4">
                {totalItems > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Until Expiry</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedData.map((item: any, index: number) => (
                          <tr key={`${item.userId}-${item.orderId}-${index}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.userName}</div>
                              <div className="text-sm text-gray-500">{item.userEmail}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.orderId.toString().slice(-8)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-green-600">
                                {item.points.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">₹{item.orderAmount.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{formatDate(item.expiryDate)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${
                                item.daysUntilExpiry <= 7 ? 'text-red-600' : 
                                item.daysUntilExpiry <= 15 ? 'text-yellow-600' : 
                                'text-green-600'
                              }`}>
                                {item.daysUntilExpiry} days
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No points expiring soon</p>
                  </div>
                )}
              </div>
            )}

            {/* Recent Activities Tab */}
            {activeTab === 'activities' && (
              <div className="space-y-4">
                {totalItems > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedData.map((activity: any, index: number) => (
                          <tr key={`${activity.userId}-${activity.orderId}-${index}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{activity.userName}</div>
                              <div className="text-sm text-gray-500">{activity.userEmail}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{activity.orderId.toString().slice(-8)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {activity.points.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">₹{activity.orderAmount.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{formatDate(activity.expiryDate)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                activity.status === 'active' ? 'bg-green-100 text-green-800' :
                                activity.status === 'expired' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {activity.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent activities</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

