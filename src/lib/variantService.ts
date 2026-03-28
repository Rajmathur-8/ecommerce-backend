import { getApiUrl, getAuthHeaders } from './config';

export interface VariantAttribute {
  name: string;
  values: string[];
}

export interface Variant {
  variantName: string;
  price: number;
  discountPrice?: number;
  stock: number;
  sku: string;
  image?: string;
  attributes?: {
    [key: string]: string;
  };
  priceScraping?: boolean;
  suggestedPricing?: {
    amazonPrice?: number;
    flipkartPrice?: number;
    suggestedPrice?: number;
  };
}

export interface VariantCombination {
  [key: string]: string;
}

export interface VariantSuggestion {
  variantName: string;
  price: number;
  stock: number;
  sku: string;
  attributes: VariantCombination;
}

// Get variant attributes for a product
export const getVariantAttributes = async (productId: string) => {
  try {
    const response = await fetch(getApiUrl(`/web/products/${productId}/variant-attributes`), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch variant attributes');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw error;
  }
};

// Update variant attributes for a product
export const updateVariantAttributes = async (
  productId: string, 
  attributes: string[], 
  variants: Variant[]
) => {
  try {
    const response = await fetch(getApiUrl(`/web/products/${productId}/variant-attributes`), {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ attributes, variants }),
    });

    if (!response.ok) {
      throw new Error('Failed to update variant attributes');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw error;
  }
};

// Generate variant combinations
export const generateVariantCombinations = async (
  productId: string, 
  attributes: { [key: string]: string[] }
) => {
  try {
    const response = await fetch(getApiUrl(`/web/products/${productId}/generate-combinations`), {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ attributes }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate variant combinations');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw error;
  }
};

// Bulk update variants
export const bulkUpdateVariants = async (
  productId: string,
  variants: Variant[],
  updateType: 'price' | 'stock' | 'discountPrice',
  value: number
) => {
  try {
    const response = await fetch(getApiUrl(`/web/products/${productId}/bulk-update-variants`), {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ variants, updateType, value }),
    });

    if (!response.ok) {
      throw new Error('Failed to bulk update variants');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw error;
  }
};

// Helper function to generate all possible combinations of attributes
export const generateAllCombinations = (attributes: { [key: string]: string[] }): VariantCombination[] => {
  const attributeNames = Object.keys(attributes);
  
  if (attributeNames.length === 0) return [{}];
  
  const generateCombinationsRecursive = (index: number): VariantCombination[] => {
    if (index >= attributeNames.length) return [{}];
    
    const currentAttr = attributeNames[index];
    const currentValues = attributes[currentAttr];
    const remainingCombinations = generateCombinationsRecursive(index + 1);
    
    const combinations: VariantCombination[] = [];
    
    currentValues.forEach(value => {
      remainingCombinations.forEach(combo => {
        combinations.push({
          ...combo,
          [currentAttr]: value
        });
      });
    });
    
    return combinations;
  };
  
  return generateCombinationsRecursive(0);
};

// Helper function to create variant suggestions from combinations
export const createVariantSuggestions = (
  combinations: VariantCombination[], 
  basePrice: number = 0, 
  baseStock: number = 0
): VariantSuggestion[] => {
  return combinations.map((combo, index) => {
    const variantName = Object.entries(combo)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    return {
      variantName,
      price: basePrice,
      stock: baseStock,
      sku: `VAR-${index + 1}`,
      attributes: combo
    };
  });
};

// Helper function to validate variant data
export const validateVariant = (variant: Variant): string[] => {
  const errors: string[] = [];
  
  if (!variant.variantName?.trim()) {
    errors.push('Variant name is required');
  }
  
  if (typeof variant.price !== 'number' || variant.price < 0) {
    errors.push('Valid price is required');
  }
  
  if (typeof variant.stock !== 'number' || variant.stock < 0) {
    errors.push('Valid stock quantity is required');
  }
  
  if (variant.discountPrice !== undefined) {
    if (typeof variant.discountPrice !== 'number' || variant.discountPrice < 0) {
      errors.push('Valid discount price is required');
    }
    
    if (variant.discountPrice > variant.price) {
      errors.push('Discount price cannot be higher than regular price');
    }
  }
  
  return errors;
};

// Helper function to format variant name from attributes
export const formatVariantName = (attributes: { [key: string]: string }): string => {
  return Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
};

// Helper function to extract unique attribute values
export const extractAttributeValues = (variants: Variant[]): { [key: string]: Set<string> } => {
  const attributeValues: { [key: string]: Set<string> } = {};
  
  variants.forEach(variant => {
    if (variant.attributes) {
      Object.entries(variant.attributes).forEach(([key, value]) => {
        if (!attributeValues[key]) {
          attributeValues[key] = new Set();
        }
        attributeValues[key].add(value);
      });
    }
  });
  
  return attributeValues;
};
