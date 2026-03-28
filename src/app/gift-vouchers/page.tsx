'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import Link from 'next/link';
import { Gift, Settings } from 'lucide-react';

export default function GiftVouchersPage() {
  const router = useRouter();

  // Redirect to details page by default
  useEffect(() => {
    router.push('/gift-vouchers/details');
  }, [router]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Gift Vouchers' }]} />
        <h1 className="text-3xl font-bold text-gray-900">Gift Voucher Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Link
            href="/gift-vouchers/details"
            className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Gift className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Gift Voucher Details</h2>
                <p className="text-gray-600 mt-1">View all gift vouchers and their details</p>
              </div>
            </div>
          </Link>

          <Link
            href="/gift-vouchers/management"
            className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Settings className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Gift Voucher Management</h2>
                <p className="text-gray-600 mt-1">Create, edit, and manage gift vouchers</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

