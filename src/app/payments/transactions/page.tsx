'use client';

export const dynamic = 'force-dynamic';

import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, Eye, CreditCard, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { getApiUrl, getAuthHeaders, formatCurrency } from '@/lib/config';
import { TableSkeleton, CardSkeleton } from '@/components/Skeleton';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Transaction {
  _id: string;
  orderId: string;
  order: {
    _id: string;
    user: {
      _id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
    address: {
      name: string;
      mobile: string;
    };
    total: number;
    paymentMethod: string;
    paymentStatus: 'pending' | 'completed' | 'failed';
    orderStatus: string;
    createdAt: string;
  };
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  method: string;
  gatewayFee?: number;
  netAmount?: number;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  'success': 'bg-green-100 text-green-800',
  'pending': 'bg-yellow-100 text-yellow-800',
  'failed': 'bg-red-100 text-red-800',
  'refunded': 'bg-gray-100 text-gray-800',
};

export default function TransactionsPage() {
  const router=useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  // Fetch transactions from backend
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedMethod !== 'all' && { method: selectedMethod })
      });

      const response = await fetch(getApiUrl(`/admin/transactions?${params}`), {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data.transactions || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalTransactions(data.data.pagination?.totalTransactions || 0);
        console.log('✅ Transactions loaded successfully:', data.data.transactions?.length || 0, 'transactions');
      } else {
        setTransactions([]);
        setTotalPages(1);
        setTotalTransactions(0);
      }
    } catch (error) {
      setTransactions([]);
      setTotalPages(1);
      setTotalTransactions(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedStatus, selectedMethod]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle filter changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
  }, [selectedStatus, selectedMethod]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);


  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Create export data from current transactions
      const exportData = transactions.map(transaction => ({
        'Transaction ID': transaction._id,
        'Order ID': transaction.orderId || transaction.order._id,
        'Customer Name': transaction.order.address.name,
        'Customer Email': transaction.order.user?.email || '',
        'Customer Phone': transaction.order.address.mobile,
        'Net Amount': transaction.netAmount || transaction.amount,
        'Payment Method': transaction.method,
        'Payment Status': transaction.status,
        'Razorpay Order ID': transaction.razorpayOrderId || '',
        'Razorpay Payment ID': transaction.razorpayPaymentId || '',
        'Transaction Date': new Date(transaction.createdAt).toLocaleDateString('en-IN'),
        'Order Status': transaction.order.orderStatus,
        'Notes': (transaction as any).notes || ''
      }));

      // Convert to CSV and download
      const csvContent = convertToCSV(exportData);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Export successful:', exportData.length, 'transactions exported');
    } catch (error) {
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadReceipt = async (transaction: Transaction) => {
    try {
      // Create receipt data
      const receiptData = {
        transactionId: transaction._id,
        orderId: transaction.orderId,
        customerName: transaction.order.address.name,
        customerEmail: transaction.order.user?.email || '',
        customerPhone: transaction.order.address.mobile,
        amount: transaction.netAmount || transaction.amount,
        paymentMethod: transaction.method,
        status: transaction.status,
        date: new Date(transaction.createdAt).toLocaleDateString('en-IN'),
        razorpayPaymentId: transaction.razorpayPaymentId || '',
        notes: (transaction as any).notes || ''
      };

      // Convert to CSV format
      const csvContent = convertToCSV([receiptData]);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt_${transaction._id.slice(-6).toUpperCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  // Use transactions directly since filtering is now done on the server
  const filteredTransactions = transactions;


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPaymentMethod = (method: string) => {
    // Convert to uppercase for display
    return method.toUpperCase();
  };

  const truncateText = (text: string, maxLength: number = 20) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Breadcrumbs items={[{ label: 'Payments', href: '/payments' }, { label: 'Transactions' }]} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-2">View and manage payment transactions</p>
          </div>
          

          
          {/* Filters Skeleton */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-10 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Transactions Table Skeleton */}
          <TableSkeleton rows={8} columns={8} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Payments', href: '/payments' }, { label: 'Transactions' }]} />
        
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-2">View and manage payment transactions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={exporting || transactions.length === 0}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className={`w-4 h-4 mr-2 ${exporting ? 'animate-spin' : ''}`} />
              {exporting ? 'Exporting...' : 'Export All'}
            </button>
          </div>
        </div>



        {/* Filters */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Method Filter */}
            <div className="w-full">
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">All Methods</option>
                <option value="razorpay">Razorpay</option>
                <option value="cod">Cash on Delivery</option>
                <option value="card">Credit/Debit Card</option>
                <option value="netbanking">Net Banking</option>
                <option value="wallet">Digital Wallet</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="w-full">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </div>



        {/* Transactions Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Transactions ({totalTransactions} total)
            </h3>
            <div className="text-sm text-gray-600">
              Showing {transactions.length} of {totalTransactions} transactions
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Transaction ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Order ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Net Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Method</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12">
                      <div className="text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
                      
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                  <tr key={transaction._id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">#{transaction._id.slice(-6).toUpperCase()}</p>
                        {transaction.razorpayPaymentId && (
                          <p className="text-sm text-gray-600">{transaction.razorpayPaymentId}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">#{transaction.order._id.slice(-6).toUpperCase()}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900" title={transaction.order.address.name}>
                          {truncateText(transaction.order.address.name, 20)}
                        </p>
                        <p className="text-sm text-gray-600" title={transaction.order.user.email}>
                          {truncateText(transaction.order.user.email, 20)}
                        </p>
                        <p className="text-sm text-gray-600">{transaction.order.address.mobile}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(transaction.netAmount || transaction.amount)}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {formatPaymentMethod(transaction.method)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        statusColors[transaction.status]
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-900">{formatDate(transaction.createdAt)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => router.push(`/orders/details/${transaction.order._id}`)}
                          className="p-1 text-gray-600 hover:text-gray-900"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {transaction.status === 'success' && (
                          <button 
                            onClick={() => handleDownloadReceipt(transaction)}
                            className="p-1 text-blue-600 hover:text-blue-700" 
                            title="Download Receipt"
                          >
                            <Download className="w-4 h-4" />
                          </button>
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
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalTransactions)} of {totalTransactions} results
            </p>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 