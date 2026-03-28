import { getApiUrl, getAuthHeaders } from './config';
import { deduplicateRequest, createRequestKey } from './apiUtils';

export interface ProductAlert {
  id: string;
  name: string;
  sku: string;
  category?: string;
  type: string;
  currentStock?: number;
  price?: number;
  discountPrice?: number;
  variantName?: string;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  productsWithVariants: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  averagePrice: number;
  totalStock: number;
  categoryDistribution: Array<{
    _id: string;
    count: number;
  }>;
}

export interface ProductAlerts {
  lowStock: ProductAlert[];
  outOfStock: ProductAlert[];
  priceIssues: ProductAlert[];
  skuIssues: Array<{
    sku: string;
    count: number;
    products: Array<{
      id: string;
      name: string;
    }>;
    type: string;
  }>;
  variantIssues: ProductAlert[];
  summary: {
    totalAlerts: number;
    lowStock: number;
    outOfStock: number;
    priceIssues: number;
    skuIssues: number;
    variantIssues: number;
  };
}

// SKU Validation
export const validateSKU = async (sku: string, productId?: string) => {
  try {
    const response = await fetch(getApiUrl('/web/products/validate-sku'), {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sku, productId }),
    });

    if (!response.ok) {
      throw new Error('Failed to validate SKU');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw error;
  }
};

// Get Product Alerts
export const getProductAlerts = async (): Promise<ProductAlerts> => {
  const requestKey = createRequestKey('/web/products/alerts');
  
  return deduplicateRequest(requestKey, async () => {
    try {
      const response = await fetch(getApiUrl('/web/products/alerts'), {
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Requested-With': 'XMLHttpRequest'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product alerts');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      throw error;
    }
  });
};

// Get Product Statistics
export const getProductStats = async (): Promise<ProductStats> => {
  try {
    const response = await fetch(getApiUrl('/web/products/stats'), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product stats');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw error;
  }
};

// Bulk Update Products
export const bulkUpdateProducts = async (
  productIds: string[],
  operation: 'activate' | 'deactivate' | 'update' | 'delete',
  updateData?: any
) => {
  try {
    const response = await fetch(getApiUrl('/web/products/bulk-update'), {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productIds, operation, updateData }),
    });

    if (!response.ok) {
      throw new Error('Failed to bulk update products');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw error;
  }
};

// Real-time SKU validation with debouncing
export const createSKUValidator = () => {
  let timeoutId: NodeJS.Timeout;

  return (sku: string, productId?: string, onResult?: (result: any) => void) => {
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(async () => {
      try {
        const result = await validateSKU(sku, productId);
        if (onResult) {
          onResult(result);
        }
      } catch (error) {
        if (onResult) {
          onResult({ isAvailable: false, message: 'Validation failed' });
        }
      }
    }, 500); // 500ms debounce
  };
};

// Alert severity levels
export const getAlertSeverity = (type: string): 'low' | 'medium' | 'high' | 'critical' => {
  switch (type) {
    case 'out_of_stock':
    case 'variant_out_of_stock':
      return 'critical';
    case 'low_stock':
      return 'high';
    case 'price_issue':
    case 'variant_price_issue':
      return 'medium';
    case 'duplicate_sku':
      return 'high';
    default:
      return 'low';
  }
};

// Alert icons
export const getAlertIcon = (type: string): string => {
  switch (type) {
    case 'out_of_stock':
    case 'variant_out_of_stock':
      return '🚫';
    case 'low_stock':
      return '⚠️';
    case 'price_issue':
    case 'variant_price_issue':
      return '💰';
    case 'duplicate_sku':
      return '🔄';
    default:
      return 'ℹ️';
  }
};

// Alert messages
export const getAlertMessage = (alert: ProductAlert): string => {
  switch (alert.type) {
    case 'out_of_stock':
      return `${alert.name} is out of stock`;
    case 'low_stock':
      return `${alert.name} has low stock (${alert.currentStock} remaining)`;
    case 'price_issue':
      return `${alert.name} has pricing issue (discount > regular price)`;
    case 'variant_out_of_stock':
      return `${alert.name} - ${alert.variantName} is out of stock`;
    case 'variant_price_issue':
      return `${alert.name} - ${alert.variantName} has pricing issue`;
    default:
      return `Issue with ${alert.name}`;
  }
};

// Format currency - re-export from config for backward compatibility
export { formatCurrency } from './config';

// Format stock level
export const formatStockLevel = (stock: number): string => {
  if (stock === 0) return 'Out of Stock';
  if (stock < 10) return `Low Stock (${stock})`;
  return `In Stock (${stock})`;
};

// Get stock status color
export const getStockStatusColor = (stock: number): string => {
  if (stock === 0) return 'text-red-600';
  if (stock < 10) return 'text-orange-600';
  return 'text-green-600';
};

// Validate product data
export const validateProductData = (data: any): string[] => {
  const errors: string[] = [];

  if (!data.productName?.trim()) {
    errors.push('Product name is required');
  }

  if (!data.price || parseFloat(data.price) <= 0) {
    errors.push('Valid price is required');
  }

  if (data.discountPrice && parseFloat(data.discountPrice) >= parseFloat(data.price)) {
    errors.push('Discount price must be less than regular price');
  }

  if (!data.category) {
    errors.push('Category is required');
  }

  if (data.stock !== undefined && parseInt(data.stock) < 0) {
    errors.push('Stock cannot be negative');
  }

  return errors;
};

// Export product data
export const exportProductData = async (filters?: any): Promise<Blob> => {
  try {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }

    const response = await fetch(getApiUrl(`/web/products/export?${queryParams}`), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to export product data');
    }

    return await response.blob();
  } catch (error) {
    throw error;
  }
};

// Import product data
export const importProductData = async (file: File): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(getApiUrl('/web/products/import'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to import product data');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw error;
  }
};
