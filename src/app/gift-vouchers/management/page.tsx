'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Plus, Search, Eye, Gift, Calendar, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiCall } from '@/lib/config';
import Link from 'next/link';

interface GiftVoucher {
  _id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minimumAmount: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  image?: string;
  applicableCategories?: any[];
  applicableProducts?: any[];
  applicableUsers?: any[];
  isFirstTimeUser: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
  totalRevenue?: number;
  totalDiscount?: number;
  isExpired?: boolean;
  isDeleted?: boolean;
}

export default function GiftVoucherManagementPage() {
  const [giftVouchers, setGiftVouchers] = useState<GiftVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchGiftVouchers();
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchGiftVouchers = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/admin/gift-vouchers/stats');
      if (response.data.success) {
        setGiftVouchers(response.data.data);
      } else {
        toast.error('Failed to load gift vouchers');
      }
    } catch (error) {
      toast.error('Failed to load gift vouchers');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredGiftVouchers = giftVouchers.filter(giftVoucher =>
    giftVoucher.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    giftVoucher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    giftVoucher.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalItems = filteredGiftVouchers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGiftVouchers = filteredGiftVouchers.slice(startIndex, endIndex);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumbs items={[{ label: 'Gift Vouchers', href: '/gift-vouchers' }, { label: 'Gift Voucher Management' }]} />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Gift Voucher Management</h1>
          <p className="text-gray-600 mt-2">View and manage gift vouchers</p>
        </div>

        {/* Search Bar */}
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search gift vouchers by code, name, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Gift Vouchers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : totalItems === 0 ? (
            <div className="col-span-3 text-center py-12 text-gray-500">
              <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No gift vouchers found</p>
            </div>
          ) : (
            paginatedGiftVouchers.map((giftVoucher) => (
              <div key={giftVoucher._id} className="card">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-primary-700">{giftVoucher.code}</span>
                    {giftVoucher.isDeleted && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{giftVoucher.name || giftVoucher.code}</h3>
                  {/* Analytics Data */}
                  <div className="mt-3 pt-3 border-t space-y-2">
                    {giftVoucher.usageCount !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Used:</span>
                        <span className="text-xs font-semibold text-gray-900">{giftVoucher.usageCount} times</span>
                      </div>
                    )}
                    {giftVoucher.totalRevenue !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Revenue:</span>
                        <span className="text-xs font-semibold text-green-600">₹{giftVoucher.totalRevenue.toLocaleString()}</span>
                      </div>
                    )}
                    {giftVoucher.totalDiscount !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Discount Given:</span>
                        <span className="text-xs font-semibold text-blue-600">₹{giftVoucher.totalDiscount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end pt-3 border-t mt-3">
                  <Link
                    href={`/gift-vouchers/${giftVoucher._id}/analytics`}
                    className="text-primary-600 hover:text-primary-900 flex items-center space-x-1 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Analytics</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalItems > 0 && totalPages > 1 && (
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
      </div>

      {/* Confirm Delete Dialog */}
    </DashboardLayout>
  );
}

