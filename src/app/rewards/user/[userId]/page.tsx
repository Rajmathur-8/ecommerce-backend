'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ArrowLeft, Gift, CheckCircle, XCircle, Clock, Calendar, TrendingUp } from 'lucide-react';
import { apiCall } from '@/lib/config';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface UserRewardDetails {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  summary: {
    totalEarned: number;
    totalRedeemed: number;
    currentActivePoints: number;
    expiredPoints: number;
    redeemedPoints: number;
    activeEntriesCount: number;
    expiredEntriesCount: number;
    redeemedEntriesCount: number;
  };
  entries: Array<{
    orderId: string;
    orderNumber: string;
    orderDate: string | null;
    orderAmount: number;
    points: number;
    expiryDate: string;
    status: 'active' | 'expired' | 'redeemed';
    daysUntilExpiry: number | null;
    daysExpired: number | null;
  }>;
}

export default function UserRewardDetailsPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [details, setDetails] = useState<UserRewardDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/admin/rewards/user/${userId}`);
      if (response.data.success) {
        setDetails(response.data.data);
      } else {
        toast.error('Failed to load user reward details');
      }
    } catch (error) {
      toast.error('Failed to load user reward details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!details) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">User reward details not found</p>
          <Link href="/rewards" className="text-primary-600 hover:text-primary-900 mt-4 inline-block">
            Back to Rewards
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumbs items={[
            { label: 'Reward Management', href: '/rewards' },
            { label: 'User Details' }
          ]} />
          <div className="flex items-center space-x-4 mt-4">
            <Link
              href="/rewards"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{details.user.name}</h1>
              <p className="text-gray-600 mt-1">{details.user.email} | {details.user.phone}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earned</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {details.summary.totalEarned.toLocaleString()}
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
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {details.summary.currentActivePoints.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {details.summary.activeEntriesCount} entries
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Gift className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired Points</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {details.summary.expiredPoints.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {details.summary.expiredEntriesCount} entries
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Redeemed Points</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">
                  {details.summary.redeemedPoints.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {details.summary.redeemedEntriesCount} entries
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Entries Table */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Reward Points History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Remaining</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {details.entries.length > 0 ? (
                  details.entries.map((entry, index) => (
                    <tr key={`${entry.orderId}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{entry.orderNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(entry.orderDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{entry.orderAmount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.points.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(entry.expiryDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          entry.status === 'active' ? 'bg-green-100 text-green-800' :
                          entry.status === 'expired' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.status === 'active' && entry.daysUntilExpiry !== null ? (
                          <div className={`text-sm font-medium ${
                            entry.daysUntilExpiry <= 7 ? 'text-red-600' :
                            entry.daysUntilExpiry <= 15 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {entry.daysUntilExpiry} days
                          </div>
                        ) : entry.status === 'expired' && entry.daysExpired !== null ? (
                          <div className="text-sm font-medium text-red-600">
                            Expired {entry.daysExpired} days ago
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">-</div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No reward entries found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

