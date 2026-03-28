'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import { ViewProductSkeleton } from '@/components/Skeleton';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Product {
  _id: string;
  productName: string;
  productTitle: string;
  productDescription: string;
  price: number;
  discountPrice?: number;
  stock: number;
  sku: string;
  unit: string;
  isActive: boolean;
  category: {
    _id: string;
    name: string;
  };
  subcategory?: {
    _id: string;
    name: string;
  };
  images: string[];
  variants: Array<{
    variantName: string;
    price: number;
    discountPrice?: number;
    stock: number;
    sku: string;
    image?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function ProductViewPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    productName: string;
  }>({
    isOpen: false,
    productName: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(getApiUrl(`/web/products/${params.id}`), {
          headers: getAuthHeaders(),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        
        const result = await response.json();
        if (result.success) {
          setProduct(result.data);
        } else {
          setError(result.message || 'Failed to fetch product');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleDeleteClick = () => {
    if (!product) return;
    
    setDeleteDialog({
      isOpen: true,
      productName: product.productName || product.productTitle
    });
  };

  const handleDeleteConfirm = async () => {
    if (!product) return;

    try {
      const response = await fetch(getApiUrl(`/web/products/${product._id}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        toast.success('Product deleted successfully!');
        router.push('/products');
      } else {
        const result = await response.json();
        toast.error(result.message || 'Failed to delete product');
      }
    } catch (err) {
      toast.error('An error occurred while deleting the product');
    } finally {
      setDeleteDialog({
        isOpen: false,
        productName: ''
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      productName: ''
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <ViewProductSkeleton />
      </DashboardLayout>
    );
  }

  if (error || !product) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">{error || 'Product not found'}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: 'Products', href: '/products' },
          { label: 'Product Details' }
        ]} />
        
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Details</h1>
          <p className="text-gray-600 mt-1">View product information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Overview */}
            <div className="card">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.productName}</h2>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                      product.isActive 
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Product Images */}
              {product.images && product.images.length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {product.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`${product.productName} - Image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {product.productDescription || 'No description available'}
                </p>
              </div>

              {/* Product Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <span className="inline-flex px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                      {product.category?.name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                    <span className="inline-flex px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                      {product.subcategory?.name || 'N/A'}
                    </span>
                  </div>

                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {product.unit || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">
                        {product.stock}
                      </span>
                      <span className="text-gray-600">units</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Product Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Variants</h2>
                <div className="space-y-4">
                  {product.variants.map((variant, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{variant.variantName}</h3>
                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                               <span className="text-sm text-gray-600">Pricing:</span>
                               <div className="mt-1 space-y-1">
                                 {variant.discountPrice ? (
                                   <>
                                     <div className="flex items-center space-x-2">
                                       <span className="text-lg font-bold text-gray-900">₹{variant.discountPrice.toLocaleString()}</span>
                                       <span className="text-sm text-gray-500 line-through">₹{variant.price.toLocaleString()}</span>
                                     </div>
                                     <div className="text-xs text-gray-600">
                                       {Math.round(((variant.price - variant.discountPrice) / variant.price) * 100)}% discount
                                     </div>
                                   </>
                                 ) : (
                                   <span className="text-lg font-bold text-gray-900">₹{variant.price.toLocaleString()}</span>
                                 )}
                               </div>
                             </div>
                             <div>
                               <span className="text-sm text-gray-600">Inventory:</span>
                               <div className="mt-1 space-y-1">
                                 <div className="text-lg font-semibold text-gray-900">{variant.stock} units</div>
                                 <div className="text-xs text-gray-600">SKU: {variant.sku}</div>
                               </div>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Product Summary */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-600">Base Price</span>
                    <div className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</div>
                  </div>
                </div>
                {product.discountPrice && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm text-gray-600">Discount Price</span>
                        <div className="text-lg font-bold text-gray-900">₹{product.discountPrice.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm text-gray-600">Discount</span>
                        <div className="text-lg font-bold text-gray-900">
                          {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-600">Variants</span>
                    <div className="text-lg font-bold text-gray-900">{product.variants?.length || 0}</div>
                  </div>
                </div>


              </div>
            </div>

            {/* Product Timeline */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Timeline</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Created</p>
                      <p className="text-xs text-gray-500">
                        {new Date(product.createdAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Updated</p>
                      <p className="text-xs text-gray-500">
                        {new Date(product.updatedAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteDialog.productName}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </DashboardLayout>
  );
} 