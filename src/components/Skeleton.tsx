import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

// Basic skeleton element
export const Skeleton: React.FC<SkeletonProps> = ({ className = "h-4 bg-gray-200 rounded", count = 1 }) => {
  if (count === 1) {
    return <div className={`animate-pulse ${className}`}></div>;
  }
  
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`animate-pulse ${className}`}></div>
      ))}
    </>
  );
};

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 6 
}) => {
  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="text-left py-3 px-4">
                  <Skeleton className="h-4 bg-gray-200 rounded w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="py-4 px-4">
                    <Skeleton className="h-4 bg-gray-200 rounded w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Card skeleton
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 bg-gray-200 rounded w-24" />
              <Skeleton className="h-8 bg-gray-200 rounded w-16" />
              <Skeleton className="h-3 bg-gray-200 rounded w-32" />
            </div>
            <Skeleton className="w-12 h-12 bg-gray-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Coupon card skeleton - matches the exact coupon card structure
export const CouponCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card">
          {/* Image Section */}
          <div className="relative">
            <Skeleton className="w-full h-40 bg-gray-200 rounded-lg mb-4" />
            {/* Status Badge */}
            <div className="absolute top-2 right-2">
              <Skeleton className="w-16 h-6 bg-gray-200 rounded-full" />
            </div>
          </div>
          
          {/* Content Section */}
          <div className="space-y-2">
            {/* Coupon Code and Value */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 bg-gray-200 rounded w-24" />
              <Skeleton className="h-5 bg-gray-200 rounded w-16" />
            </div>
            
            {/* Description */}
            <Skeleton className="h-4 bg-gray-200 rounded w-full" />
            
            {/* Details */}
            <div className="text-xs text-gray-500 space-y-1">
              <Skeleton className="h-3 bg-gray-200 rounded w-32" />
              <Skeleton className="h-3 bg-gray-200 rounded w-28" />
              <Skeleton className="h-3 bg-gray-200 rounded w-24" />
            </div>
            
            {/* Flash Sale Section (if applicable) */}
            <div className="mt-1 p-1 bg-orange-50 rounded">
              <Skeleton className="h-3 bg-orange-200 rounded w-20 mb-1" />
              <Skeleton className="h-3 bg-orange-200 rounded w-36" />
            </div>
          </div>
          
          {/* Actions Section */}
          <div className="flex items-center justify-between pt-3 border-t mt-3">
            <div className="flex items-center space-x-2">
              <Skeleton className="w-6 h-6 bg-gray-200 rounded" />
              <Skeleton className="w-6 h-6 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Product card skeleton
export const ProductCardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card">
          <div className="space-y-4">
            <Skeleton className="h-48 bg-gray-200 rounded-lg w-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 bg-gray-200 rounded w-3/4" />
              <Skeleton className="h-4 bg-gray-200 rounded w-1/2" />
              <Skeleton className="h-6 bg-gray-200 rounded w-1/3" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 bg-gray-200 rounded w-20" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8 bg-gray-200 rounded" />
                <Skeleton className="h-8 w-8 bg-gray-200 rounded" />
                <Skeleton className="h-8 w-8 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Products table skeleton
export const ProductsTableSkeleton: React.FC = () => {
  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {Array.from({ length: 7 }).map((_, index) => (
                <th key={index} className="text-left py-3 px-4">
                  <Skeleton className="h-4 bg-gray-200 rounded w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b">
                {/* Product column */}
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-12 h-12 bg-gray-200 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 bg-gray-200 rounded w-32" />
                      <Skeleton className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                  </div>
                </td>
                {/* SKU column */}
                <td className="py-4 px-4">
                  <Skeleton className="h-6 bg-gray-200 rounded w-20" />
                </td>
                {/* Category column */}
                <td className="py-4 px-4">
                  <Skeleton className="h-6 bg-gray-200 rounded w-16" />
                </td>
                {/* Price column */}
                <td className="py-4 px-4">
                  <Skeleton className="h-4 bg-gray-200 rounded w-16" />
                </td>
                {/* Stock column */}
                <td className="py-4 px-4">
                  <Skeleton className="h-4 bg-gray-200 rounded w-8" />
                </td>
                {/* Status column */}
                <td className="py-4 px-4">
                  <Skeleton className="h-6 bg-gray-200 rounded w-16" />
                </td>
                {/* Actions column */}
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-6 bg-gray-200 rounded" />
                    <Skeleton className="h-6 w-6 bg-gray-200 rounded" />
                    <Skeleton className="h-6 w-6 bg-gray-200 rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination skeleton */}
      <div className="flex items-center justify-between mt-6">
        <Skeleton className="h-4 bg-gray-200 rounded w-48" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-20 bg-gray-200 rounded" />
          <Skeleton className="h-8 w-8 bg-gray-200 rounded" />
          <Skeleton className="h-8 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
};

// Banner skeleton
export const BannerSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card">
          <div className="space-y-4">
            <Skeleton className="h-32 bg-gray-200 rounded-lg w-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 bg-gray-200 rounded w-3/4" />
              <Skeleton className="h-4 bg-gray-200 rounded w-full" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 bg-gray-200 rounded w-16" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8 bg-gray-200 rounded" />
                <Skeleton className="h-8 w-8 bg-gray-200 rounded" />
                <Skeleton className="h-8 w-8 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Order skeleton
export const OrderSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 bg-gray-200 rounded w-24" />
                <Skeleton className="h-3 bg-gray-200 rounded w-32" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-4 bg-gray-200 rounded w-20" />
              <Skeleton className="h-6 bg-gray-200 rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Customer skeleton - matches the exact table structure
export const CustomerSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                <Skeleton className="h-4 bg-gray-200 rounded w-20" />
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                <Skeleton className="h-4 bg-gray-200 rounded w-16" />
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                <Skeleton className="h-4 bg-gray-200 rounded w-20" />
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                <Skeleton className="h-4 bg-gray-200 rounded w-16" />
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                <Skeleton className="h-4 bg-gray-200 rounded w-24" />
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                <Skeleton className="h-4 bg-gray-200 rounded w-16" />
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                <Skeleton className="h-4 bg-gray-200 rounded w-16" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: count }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b hover:bg-gray-50">
                {/* Customer column */}
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2 max-w-[200px]">
                    <Skeleton className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 bg-gray-200 rounded w-24" />
                  </div>
                </td>
                {/* Contact column */}
                <td className="py-3 px-4">
                  <Skeleton className="h-4 bg-gray-200 rounded w-32" />
                </td>
                {/* Join Date column */}
                <td className="py-3 px-4">
                  <Skeleton className="h-4 bg-gray-200 rounded w-20" />
                </td>
                {/* Orders column */}
                <td className="py-3 px-4">
                  <Skeleton className="h-6 bg-gray-200 rounded w-16" />
                </td>
                {/* Reward Points column */}
                <td className="py-3 px-4">
                  <Skeleton className="h-4 bg-gray-200 rounded w-12" />
                </td>
                {/* Status column */}
                <td className="py-3 px-4">
                  <Skeleton className="h-6 bg-gray-200 rounded w-16" />
                </td>
                {/* Actions column */}
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-1">
                    <Skeleton className="h-4 w-4 bg-gray-200 rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between mt-6">
        <Skeleton className="h-4 bg-gray-200 rounded w-48" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-20 bg-gray-200 rounded" />
          <Skeleton className="h-8 w-8 bg-gray-200 rounded" />
          <Skeleton className="h-8 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
};

// Dashboard stats skeleton
export const DashboardStatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="card">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 bg-gray-200 rounded w-24" />
              <Skeleton className="h-8 bg-gray-200 rounded w-20" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 bg-gray-200 rounded" />
                <Skeleton className="h-3 bg-gray-200 rounded w-12" />
                <Skeleton className="h-3 bg-gray-200 rounded w-24" />
              </div>
            </div>
            <Skeleton className="w-12 h-12 bg-gray-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Edit Product skeleton - matches exact form structure
export const EditProductSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Skeleton className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div>
          <Skeleton className="h-8 bg-gray-200 rounded w-48" />
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <Skeleton className="h-6 bg-gray-200 rounded w-40 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 bg-gray-200 rounded w-24" />
                <Skeleton className="h-10 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2">
            <Skeleton className="h-4 bg-gray-200 rounded w-24" />
            <Skeleton className="h-24 bg-gray-200 rounded w-full" />
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="card">
          <Skeleton className="h-6 bg-gray-200 rounded w-48 mb-6" />
          
          {/* Market Intelligence Section */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-10 h-10 bg-blue-200 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 bg-blue-200 rounded w-32" />
                  <Skeleton className="h-3 bg-blue-200 rounded w-48" />
                </div>
              </div>
            </div>
            
            {/* Price Scraper Skeleton */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 bg-blue-200 rounded w-16" />
                      <Skeleton className="h-4 bg-blue-200 rounded w-12" />
                    </div>
                    <Skeleton className="h-10 bg-blue-200 rounded w-full" />
                    <Skeleton className="h-3 bg-blue-200 rounded w-32" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-12 bg-blue-200 rounded w-full" />
            </div>
          </div>
          
          {/* Pricing Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Base Pricing */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Skeleton className="w-1 h-6 bg-blue-200 rounded" />
                <Skeleton className="h-5 bg-gray-200 rounded w-24" />
              </div>
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-4 bg-gray-200 rounded w-28" />
                    <div className="relative">
                      <Skeleton className="h-10 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Inventory Management */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Skeleton className="w-1 h-6 bg-green-200 rounded" />
                <Skeleton className="h-5 bg-gray-200 rounded w-32" />
              </div>
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-4 bg-gray-200 rounded w-24" />
                    <div className="relative">
                      <Skeleton className="h-10 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="card">
          <Skeleton className="h-6 bg-gray-200 rounded w-32 mb-6" />
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Skeleton className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2" />
              <Skeleton className="h-4 bg-gray-200 rounded w-48 mx-auto mb-2" />
              <Skeleton className="h-3 bg-gray-200 rounded w-32 mx-auto mb-2" />
              <Skeleton className="h-8 bg-gray-200 rounded w-24 mx-auto mt-2" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="w-full h-24 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="card">
          <Skeleton className="h-6 bg-gray-200 rounded w-24 mb-6" />
          <Skeleton className="h-10 bg-gray-200 rounded w-32 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border p-4 rounded mb-2">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex flex-1 gap-4 w-full">
                    {Array.from({ length: 5 }).map((_, colIndex) => (
                      <Skeleton key={colIndex} className="h-10 bg-gray-200 rounded flex-1" />
                    ))}
                  </div>
                  <Skeleton className="w-10 h-10 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-8">
        <Skeleton className="h-12 bg-gray-200 rounded w-32" />
        <Skeleton className="h-12 bg-gray-200 rounded w-24" />
      </div>
    </div>
  );
};

// Customer Details skeleton - matches the exact layout
export const CustomerDetailsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Skeleton className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 bg-gray-200 rounded w-48" />
          <Skeleton className="h-4 bg-gray-200 rounded w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info Card */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="text-center">
              <Skeleton className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 bg-gray-200 rounded w-32 mx-auto mb-2" />
              <Skeleton className="h-4 bg-gray-200 rounded w-40 mx-auto mb-3" />
              <Skeleton className="h-6 bg-gray-200 rounded w-20 mx-auto" />
            </div>

            <div className="mt-6 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Skeleton className="w-5 h-5 bg-gray-200 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 bg-gray-200 rounded w-16" />
                    <Skeleton className="h-4 bg-gray-200 rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="card text-center hover:shadow-lg transition-shadow">
                <div className="p-4">
                  <Skeleton className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3" />
                  <Skeleton className="h-6 bg-gray-200 rounded w-12 mx-auto mb-2" />
                  <Skeleton className="h-4 bg-gray-200 rounded w-20 mx-auto" />
                </div>
              </div>
            ))}
          </div>

          {/* Reward Points */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Skeleton className="w-5 h-5 bg-gray-200 rounded" />
              <Skeleton className="h-6 bg-gray-200 rounded w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Skeleton className="h-6 bg-gray-200 rounded w-12 mx-auto mb-2" />
                  <Skeleton className="h-4 bg-gray-200 rounded w-20 mx-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Addresses */}
          <div className="card">
            <Skeleton className="h-6 bg-gray-200 rounded w-24 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-4 bg-gray-200 rounded w-24" />
                    <Skeleton className="h-5 bg-gray-200 rounded w-16" />
                  </div>
                  <Skeleton className="h-4 bg-gray-200 rounded w-full mb-1" />
                  <Skeleton className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                  <Skeleton className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card">
            <Skeleton className="h-6 bg-gray-200 rounded w-32 mb-4" />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <th key={index} className="text-left py-2 font-medium text-gray-900">
                        <Skeleton className="h-4 bg-gray-200 rounded w-16" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 3 }).map((_, rowIndex) => (
                    <tr key={rowIndex} className="border-b">
                      {Array.from({ length: 4 }).map((_, colIndex) => (
                        <td key={colIndex} className="py-2">
                          <Skeleton className="h-4 bg-gray-200 rounded w-full" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Form skeleton
export const FormSkeleton: React.FC = () => {
  return (
    <div className="card">
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 bg-gray-200 rounded w-20" />
            <Skeleton className="h-10 bg-gray-200 rounded w-full" />
          </div>
        ))}
        <div className="flex space-x-4">
          <Skeleton className="h-10 bg-gray-200 rounded w-24" />
          <Skeleton className="h-10 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );
};

// Dashboard skeleton - matches the exact layout
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Skeleton className="h-8 bg-gray-200 rounded w-32 mb-2" />
        <Skeleton className="h-4 bg-gray-200 rounded w-80" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 bg-gray-200 rounded w-24" />
                <Skeleton className="h-8 bg-gray-200 rounded w-20" />
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 bg-gray-200 rounded" />
                  <Skeleton className="h-3 bg-gray-200 rounded w-12" />
                  <Skeleton className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
              <Skeleton className="w-12 h-12 bg-gray-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 bg-gray-200 rounded w-32" />
            <Skeleton className="h-4 bg-gray-200 rounded w-16" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 bg-gray-200 rounded w-24" />
                    <Skeleton className="h-3 bg-gray-200 rounded w-32" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-4 bg-gray-200 rounded w-20" />
                  <Skeleton className="h-6 bg-gray-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 bg-gray-200 rounded w-28" />
            <Skeleton className="h-4 bg-gray-200 rounded w-16" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-8 h-8 bg-gray-200 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 bg-gray-200 rounded w-32" />
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <Skeleton key={starIndex} className="w-3 h-3 bg-gray-200 rounded" />
                        ))}
                      </div>
                      <Skeleton className="h-3 bg-gray-200 rounded w-8" />
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-4 bg-gray-200 rounded w-20" />
                  <Skeleton className="h-3 bg-gray-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <Skeleton className="h-6 bg-gray-200 rounded w-28 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3 p-4 border rounded-lg">
              <Skeleton className="w-6 h-6 bg-gray-200 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-4 bg-gray-200 rounded w-20" />
                <Skeleton className="h-3 bg-gray-200 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// View Product skeleton
export const ViewProductSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Skeleton className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 bg-gray-200 rounded w-48" />
          <Skeleton className="h-4 bg-gray-200 rounded w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Overview */}
          <div className="card">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-2">
                <Skeleton className="h-8 bg-gray-200 rounded w-64" />
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-6 bg-gray-200 rounded w-16" />
                  <Skeleton className="h-4 bg-gray-200 rounded w-24" />
                </div>
              </div>
            </div>

            {/* Product Images */}
            <div className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="w-full h-32 bg-gray-200 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <Skeleton className="h-6 bg-gray-200 rounded w-32 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 bg-gray-200 rounded w-full" />
                <Skeleton className="h-4 bg-gray-200 rounded w-3/4" />
                <Skeleton className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-4 bg-gray-200 rounded w-20" />
                    <Skeleton className="h-8 bg-gray-200 rounded w-32" />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-4 bg-gray-200 rounded w-24" />
                    <Skeleton className="h-8 bg-gray-200 rounded w-40" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Product Variants */}
          <div className="card">
            <Skeleton className="h-6 bg-gray-200 rounded w-40 mb-6" />
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <th key={index} className="px-6 py-3 text-left">
                        <Skeleton className="h-4 bg-gray-200 rounded w-20" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.from({ length: 3 }).map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {Array.from({ length: 5 }).map((_, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-4 bg-gray-200 rounded w-full" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Summary */}
          <div className="card">
            <Skeleton className="h-6 bg-gray-200 rounded w-32 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Skeleton className="h-4 bg-gray-200 rounded w-20" />
                  <Skeleton className="h-6 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Product Timeline */}
          <div className="card">
            <Skeleton className="h-6 bg-gray-200 rounded w-36 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Skeleton className="w-2 h-2 bg-gray-200 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 bg-gray-200 rounded w-16" />
                    <Skeleton className="h-3 bg-gray-200 rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
