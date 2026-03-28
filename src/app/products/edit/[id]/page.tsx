'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Trash2, Plus, X, Package, RefreshCw, Search } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getApiUrl, getAuthHeaders, getFormDataHeaders } from '@/lib/config';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { EditProductSkeleton } from '@/components/Skeleton';

interface Category {
  _id: string;
  name: string;
}

interface Subcategory {
  _id: string;
  name: string;
  category: string | { _id: string; name: string };
}

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
  isPreOrder?: boolean;
  category: string;
  subcategory?: string;
  images: string[];
  splineModelUrl?: string;
  youtubeVideoUrls?: string[];
  productVideos?: string[];
  brandName?: string;
  modelNumber?: string;
  manufacturerPartNumber?: string;
  eanCode?: string;
  keyFeatures?: string[];
  whatsInBox?: string[];
  specifications?: Array<{ key: string; value: string }>;
  variants: Array<{
    variantName: string;
    price: number;
    discountPrice?: number;
    stock: number;
    sku: string;
    image?: string;
  }>;
}

interface Variant {
  variantName: string;
  price: number;
  discountPrice?: number;
  stock: number;
  sku: string;
  image?: string;
  attributes?: {
    size?: string;
    color?: string;
    model?: string;
    material?: string;
    [key: string]: string | undefined;
  };
}

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    productName: '',
    productTitle: '',
    productDescription: '',
    price: '',
    discountPrice: '',
    stock: '',
    sku: '',
    unit: '',
    category: '',
    subcategory: '',
    splineModelUrl: '',
    youtubeVideoUrls: [''],
    brandName: '',
    modelNumber: '',
    manufacturerPartNumber: '',
    eanCode: '',
    keyFeatures: [''],
    whatsInBox: [''],
    specifications: [{ key: '', value: '' }],
    shipmentLength: '',
    shipmentWidth: '',
    shipmentHeight: '',
    shipmentWeight: '',
    isActive: true,
    isPreOrder: false
  });
  const [weightUnit, setWeightUnit] = useState<'kg' | 'gm'>('kg');
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [existingVideos, setExistingVideos] = useState<string[]>([]);

  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantAttributes, setVariantAttributes] = useState<string[]>(['size', 'color']);
  const [newAttribute, setNewAttribute] = useState('');
  const [attributeValues, setAttributeValues] = useState<{ [key: string]: string[] }>({
    size: ['S', 'M', 'L'],
    color: ['Red', 'Blue', 'Green']
  });
  // Store raw input strings for attribute values to allow free typing with spaces
  const [attributeValueInputs, setAttributeValueInputs] = useState<{ [key: string]: string }>({
    size: 'S, M, L',
    color: 'Red, Blue, Green'
  });
  
  // Frequently Bought Together states
  const [frequentlyBoughtTogether, setFrequentlyBoughtTogether] = useState<any[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productSearchResults, setProductSearchResults] = useState<any[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await fetch(getApiUrl('/web/categories'), {
          headers: getAuthHeaders(),
        });
        if (categoriesResponse.ok) {
          const categoriesResult = await categoriesResponse.json();
          setCategories(categoriesResult.data || []);
        }

        // Fetch subcategories
        const subcategoriesResponse = await fetch(getApiUrl('/web/subcategories'), {
          headers: getAuthHeaders(),
        });
        if (subcategoriesResponse.ok) {
          const subcategoriesResult = await subcategoriesResponse.json();
          setSubcategories(subcategoriesResult.data || []);
        }

        // Fetch product
        const productResponse = await fetch(getApiUrl(`/web/products/${params.id}`), {
          headers: getAuthHeaders(),
        });
        
        if (!productResponse.ok) {
          throw new Error('Failed to fetch product');
        }
        
        const productResult = await productResponse.json();
        if (productResult.success) {
          const productData = productResult.data;
          setProduct(productData);
          
          // Set form data
          setFormData({
            productName: productData.productName || '',
            productTitle: productData.productTitle || '',
            productDescription: productData.productDescription || '',
            price: productData.price?.toString() || '',
            discountPrice: productData.discountPrice?.toString() || '',
            stock: productData.stock?.toString() || '',
            sku: productData.sku || '',
            unit: productData.unit || '',
            category: productData.category?._id || productData.category || '',
            subcategory: productData.subcategory?._id || productData.subcategory || '',
            splineModelUrl: productData.splineModelUrl || '',
            youtubeVideoUrls: productData.youtubeVideoUrls && Array.isArray(productData.youtubeVideoUrls) && productData.youtubeVideoUrls.length > 0 
              ? productData.youtubeVideoUrls 
              : [''],
            brandName: productData.brandName || '',
            modelNumber: productData.modelNumber || '',
            manufacturerPartNumber: productData.manufacturerPartNumber || '',
            eanCode: productData.eanCode || '',
            keyFeatures: productData.keyFeatures && productData.keyFeatures.length > 0 ? productData.keyFeatures : [''],
            whatsInBox: productData.whatsInBox && productData.whatsInBox.length > 0 ? productData.whatsInBox : [''],
            specifications: productData.specifications && productData.specifications.length > 0 ? productData.specifications : [{ key: '', value: '' }],
            shipmentLength: productData.shipmentLength?.toString() || '',
            shipmentWidth: productData.shipmentWidth?.toString() || '',
            shipmentHeight: productData.shipmentHeight?.toString() || '',
            shipmentWeight: productData.shipmentWeight?.toString() || '',
            isActive: productData.isActive ?? true,
            isPreOrder: productData.isPreOrder ?? false
          });

          // Set images
          setImages(productData.images || []);

          // Set variants
          setVariants(productData.variants || []);
          
          // Extract variant attributes from existing variants
          if (productData.variants && productData.variants.length > 0) {
            const allAttributes = new Set<string>();
            productData.variants.forEach((variant: any) => {
              if (variant.attributes) {
                Object.keys(variant.attributes).forEach(attr => {
                  allAttributes.add(attr);
                });
              }
            });
            
            if (allAttributes.size > 0) {
              const extractedAttributes = Array.from(allAttributes);
              setVariantAttributes(extractedAttributes);
              
              // Initialize attribute values from existing variants
              const extractedAttributeValues: { [key: string]: string[] } = {};
              const extractedAttributeInputs: { [key: string]: string } = {};
              
              extractedAttributes.forEach(attr => {
                const values = new Set<string>();
                productData.variants.forEach((variant: any) => {
                  if (variant.attributes && variant.attributes[attr]) {
                    values.add(variant.attributes[attr]);
                  }
                });
                
                const valuesArray = Array.from(values);
                extractedAttributeValues[attr] = valuesArray;
                extractedAttributeInputs[attr] = valuesArray.join(', ');
              });
              
              setAttributeValues(prev => ({ ...prev, ...extractedAttributeValues }));
              setAttributeValueInputs(prev => ({ ...prev, ...extractedAttributeInputs }));
            }
          }
          
          // Set frequentlyBoughtTogether - fetch full product details if populated
          if (productData.frequentlyBoughtTogether && productData.frequentlyBoughtTogether.length > 0) {
            // If already populated with product details, use them
            if (typeof productData.frequentlyBoughtTogether[0] === 'object' && productData.frequentlyBoughtTogether[0].productName) {
              setFrequentlyBoughtTogether(productData.frequentlyBoughtTogether);
            } else {
              // If just IDs, we'll fetch them later or leave empty (will be populated on save)
              setFrequentlyBoughtTogether([]);
            }
          }
        } else {
          setError(productResult.message || 'Failed to fetch product');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Price validation
    if (name === 'price') {
      const price = parseFloat(value);
      if (price < 0) {
        toast.error('Price cannot be negative');
        return;
      }
      // Clear discount price if it's higher than new price
      if (formData.discountPrice && parseFloat(formData.discountPrice) > price) {
        setFormData(prev => ({ ...prev, discountPrice: '' }));
        toast.error('Discount price cannot be higher than regular price. Discount price has been cleared.');
        return;
      }
    }

    if (name === 'discountPrice') {
      const discountPrice = parseFloat(value);
      if (discountPrice < 0) {
        toast.error('Discount price cannot be negative');
        return;
      }
      if (formData.price && discountPrice > parseFloat(formData.price)) {
        toast.error('Discount price cannot be higher than regular price');
        return;
      }
    }
  };

  // Search products for Frequently Bought Together
  const searchProducts = async (query: string) => {
    if (!query || query.length < 2) {
      setProductSearchResults([]);
      return;
    }

    setProductSearchLoading(true);
    try {
      const response = await fetch(getApiUrl(`/web/products?search=${encodeURIComponent(query)}&limit=10`), {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        // Filter out current product and already selected products
        const selectedIds = frequentlyBoughtTogether.map(p => p._id);
        const filtered = data.data.filter((product: any) => 
          product._id !== params.id && !selectedIds.includes(product._id)
        );
        setProductSearchResults(filtered);
      } else {
        setProductSearchResults([]);
      }
    } catch (error) {
      setProductSearchResults([]);
    } finally {
      setProductSearchLoading(false);
    }
  };

  // Handle product search input change
  const handleProductSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setProductSearchQuery(query);
    if (query.length >= 2) {
      searchProducts(query);
      setShowProductSearch(true);
    } else {
      setProductSearchResults([]);
      setShowProductSearch(false);
    }
  };

  // Add product to Frequently Bought Together
  const addToFrequentlyBoughtTogether = (product: any) => {
    if (frequentlyBoughtTogether.find(p => p._id === product._id)) {
      toast.error('Product already added');
      return;
    }
    setFrequentlyBoughtTogether(prev => [...prev, product]);
    setProductSearchQuery('');
    setProductSearchResults([]);
    setShowProductSearch(false);
    toast.success('Product added to Frequently Bought Together');
  };

  // Remove product from Frequently Bought Together
  const removeFromFrequentlyBoughtTogether = (productId: string) => {
    setFrequentlyBoughtTogether(prev => prev.filter(p => p._id !== productId));
    toast.success('Product removed');
  };

  // Get current price for display
  const getProductPrice = (product: any) => {
    return product.discountPrice || product.price || 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newImageFiles = [...imageFiles];
    const newImages = [...images];

    files.forEach(file => {
      newImageFiles.push(file);
      newImages.push(URL.createObjectURL(file));
    });

    setImageFiles(newImageFiles);
    setImages(newImages);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newImageFiles = imageFiles.filter((_, i) => i !== index);
    setImages(newImages);
    setImageFiles(newImageFiles);
  };

  // Helper function to calculate total file size
  const calculateTotalFileSize = (): number => {
    let totalSize = 0;
    
    // Product images
    imageFiles.forEach(file => {
      totalSize += file.size;
    });
    
    // Video files
    videoFiles.forEach(file => {
      totalSize += file.size;
    });
    
    return totalSize;
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    const validPreviews: string[] = [];
    const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5MB

    newFiles.forEach((file) => {
      // Check file size (5MB max per file)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB per video.`);
        return;
      }

      // Check if it's a video file
      if (!file.type.startsWith('video/')) {
        toast.error(`${file.name} is not a valid video file.`);
        return;
      }

      validFiles.push(file);
    });

    // Check total size including new video files
    if (validFiles.length > 0) {
      const currentTotal = calculateTotalFileSize();
      const newFilesSize = validFiles.reduce((sum, file) => sum + file.size, 0);
      const newTotal = currentTotal + newFilesSize;
      
      if (newTotal > MAX_TOTAL_SIZE) {
        const currentMB = (currentTotal / 1024 / 1024).toFixed(2);
        const newMB = (newTotal / 1024 / 1024).toFixed(2);
        toast.error(`Total upload size will be ${newMB}MB, which exceeds the maximum limit of 5MB. Current total: ${currentMB}MB`);
        return;
      }

      validFiles.forEach(file => {
        validPreviews.push(URL.createObjectURL(file));
      });

      setVideoFiles(prev => [...prev, ...validFiles]);
      setVideoPreviews(prev => [...prev, ...validPreviews]);
    }
  };

  const handleRemoveVideo = (index: number) => {
    // Revoke the object URL to free memory
    if (videoPreviews[index]) {
      URL.revokeObjectURL(videoPreviews[index]);
    }
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingVideo = (index: number) => {
    setExistingVideos(prev => prev.filter((_, i) => i !== index));
    toast.success('Video removed');
  };

  const isValidYouTubeUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid (optional field)
    const patterns = [
      /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/,
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const addVariant = () => {
    const newVariant: Variant = {
      variantName: '',
      price: 0,
      stock: 0,
      sku: '',
      attributes: {}
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (idx: number, field: string, value: string) => {
    const updatedVariants = [...variants];
    
    if (field === 'price' || field === 'discountPrice' || field === 'stock') {
      const numValue = parseFloat(value);
      if (numValue < 0) {
        toast.error(`${field} cannot be negative`);
        return;
      }
      
      // Price validation for variants
      if (field === 'price') {
        const price = numValue;
        if (updatedVariants[idx].discountPrice && updatedVariants[idx].discountPrice > price) {
          updatedVariants[idx].discountPrice = undefined;
          toast.error('Variant discount price cannot be higher than regular price. Discount price has been cleared.');
        }
      }
      
      if (field === 'discountPrice') {
        const discountPrice = numValue;
        const price = updatedVariants[idx].price;
        if (discountPrice > price) {
          toast.error('Variant discount price cannot be higher than regular price');
          return;
        }
      }
      
      (updatedVariants[idx] as any)[field] = numValue;
    } else {
      (updatedVariants[idx] as any)[field] = value;
    }
    
    setVariants(updatedVariants);
  };

  const updateVariantAttribute = (idx: number, attribute: string, value: string) => {
    const updatedVariants = [...variants];
    
    if (!updatedVariants[idx].attributes) {
      updatedVariants[idx].attributes = {};
    }
    
    (updatedVariants[idx].attributes as any)[attribute] = value;
    setVariants(updatedVariants);
  };

  const updateVariantAttributeHex = (idx: number, attribute: string, hexCode: string) => {
    const updatedVariants = [...variants];
    
    if (!updatedVariants[idx].attributes) {
      updatedVariants[idx].attributes = {};
    }
    
    const hexKey = `${attribute}Hex`;
    (updatedVariants[idx].attributes as any)[hexKey] = hexCode;
    setVariants(updatedVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.productName.trim()) {
      toast.error('Product name is required');
      return;
    }
    
    // Skip price validation for pre-order products
    if (!formData.isPreOrder) {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        toast.error('Valid price is required');
        return;
      }
      
      if (formData.discountPrice && parseFloat(formData.discountPrice) >= parseFloat(formData.price)) {
        toast.error('Discount price must be less than regular price');
        return;
      }
    }

    // Validate variants
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const variantPrice = parseFloat(variant.price.toString());
      const variantDiscountPrice = variant.discountPrice ? parseFloat(variant.discountPrice.toString()) : 0;
      
      if (variantPrice < 0) {
        toast.error(`Variant ${i + 1} price cannot be negative`);
        return;
      }
      
      if (variantDiscountPrice < 0) {
        toast.error(`Variant ${i + 1} discount price cannot be negative`);
        return;
      }
      
      if (variantDiscountPrice > variantPrice) {
        toast.error(`Variant ${i + 1} discount price cannot be higher than regular price`);
        return;
      }
    }

    setSaving(true);
    setUploadingImages(true);

    try {
      const formDataToSend = new FormData();
      
      // Append basic form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'isActive' || key === 'isPreOrder') {
          // Handle boolean fields explicitly
          formDataToSend.append(key, (value as boolean).toString());
        } else if (key === 'keyFeatures' || key === 'whatsInBox') {
          // Filter out empty strings and stringify array
          const cleanArray = (value as string[]).filter(item => item.trim());
          formDataToSend.append(key, JSON.stringify(cleanArray));
        } else if (key === 'specifications') {
          // Filter out empty specifications and stringify
          const cleanSpecs = (value as Array<{ key: string; value: string }>).filter(spec => spec.key.trim() && spec.value.trim());
          formDataToSend.append(key, JSON.stringify(cleanSpecs));
        } else if (key === 'shipmentWeight' && value) {
          // Convert to kg if unit is gm
          let weightValue = parseFloat(value.toString());
          if (weightUnit === 'gm') {
            weightValue = weightValue / 1000; // Convert gm to kg
          }
          formDataToSend.append(key, weightValue.toString());
        } else if (key === 'youtubeVideoUrls' && Array.isArray(value)) {
          // Validate and add multiple YouTube URLs
          const validUrls = (value as string[]).filter((url: string) => url && typeof url === 'string' && url.trim() !== '');
          if (validUrls.length > 0) {
            for (const url of validUrls) {
              if (!isValidYouTubeUrl(url)) {
                toast.error(`Invalid YouTube URL: ${url}`);
                setSaving(false);
                setUploadingImages(false);
                return;
              }
            }
            formDataToSend.append('youtubeVideoUrls', JSON.stringify(validUrls));
          }
        } else if (Array.isArray(value) || typeof value === 'object') {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, value.toString());
        }
      });
      
      // Append images
      imageFiles.forEach(file => {
        formDataToSend.append('images', file);
      });

      // Append video files (multiple)
      if (videoFiles.length > 0) {
        videoFiles.forEach(file => {
          formDataToSend.append('productVideos', file);
        });
      }

      // Preserve existing videos
      if (existingVideos.length > 0) {
        formDataToSend.append('existingVideos', JSON.stringify(existingVideos));
      }
      
      // Append variants
      formDataToSend.append('variants', JSON.stringify(variants));
      
      // Add Frequently Bought Together products
      const frequentlyBoughtTogetherIds = frequentlyBoughtTogether.map(p => p._id);
      formDataToSend.append('frequentlyBoughtTogether', JSON.stringify(frequentlyBoughtTogetherIds));
      
      const response = await fetch(getApiUrl(`/web/products/${params.id}`), {
        method: 'PUT',
        headers: getFormDataHeaders(),
        body: formDataToSend
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('Product updated successfully!');
          router.push('/products');
        } else {
          toast.error(result.message || 'Failed to update product');
        }
      } else {
        const result = await response.json();
        toast.error(result.message || 'Failed to update product');
      }
    } catch (err) {
      toast.error('Failed to update product. Please try again.');
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <EditProductSkeleton />
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
          { label: 'Edit Product' }
        ]} />
        
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        </div>

        {/* Product Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                    <input type="text" name="productName" value={formData.productName} onChange={handleInputChange} className="input-field w-full" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Title</label>
                    <input type="text" name="productTitle" value={formData.productTitle} onChange={handleInputChange} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} className="input-field w-full" required>
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                    <select name="subcategory" value={formData.subcategory} onChange={handleInputChange} className="input-field w-full">
                      <option value="">Select Subcategory</option>
                      {subcategories
                        .filter(sc => {
                          const categoryId = typeof sc.category === 'string' ? sc.category : sc.category?._id;
                          return categoryId === formData.category;
                        })
                        .map((sc) => (
                          <option key={sc._id} value={sc._id}>{sc.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                    <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                    <input type="text" name="unit" value={formData.unit} onChange={handleInputChange} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name *</label>
                    <input type="text" name="brandName" value={formData.brandName} onChange={handleInputChange} className="input-field w-full" placeholder="e.g., Apple, Samsung, Dell" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model Number *</label>
                    <input type="text" name="modelNumber" value={formData.modelNumber} onChange={handleInputChange} className="input-field w-full" placeholder="e.g., A3090, MLY33HN/A" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer Part Number</label>
                    <input type="text" name="manufacturerPartNumber" value={formData.manufacturerPartNumber} onChange={handleInputChange} className="input-field w-full" placeholder="e.g., MQ6K3HN/A" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">EAN Code</label>
                    <input type="text" name="eanCode" value={formData.eanCode} onChange={handleInputChange} className="input-field w-full" placeholder="e.g., 1234567890123" />
                  </div>
                </div>

                {/* 3D Model Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">3D Model</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Spline 3D Model URL
                    </label>
                    <input 
                      type="url" 
                      name="splineModelUrl" 
                      value={formData.splineModelUrl} 
                      onChange={handleInputChange} 
                      className="input-field w-full" 
                      placeholder="https://prod.spline.design/..." 
                    />
                  </div>
                </div>

                {/* Video Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Video</h3>
                  
                  {/* YouTube Video URLs */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      YouTube Video URLs
                    </label>
                    <div className="space-y-2">
                      {formData.youtubeVideoUrls.map((url, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input 
                            type="url" 
                            value={url} 
                            onChange={(e) => {
                              const newUrls = [...formData.youtubeVideoUrls];
                              newUrls[index] = e.target.value;
                              setFormData(prev => ({ ...prev, youtubeVideoUrls: newUrls }));
                            }}
                            className="input-field flex-1" 
                            placeholder="https://www.youtube.com/watch?v=..." 
                          />
                          {formData.youtubeVideoUrls.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newUrls = formData.youtubeVideoUrls.filter((_, i) => i !== index);
                                setFormData(prev => ({ ...prev, youtubeVideoUrls: newUrls }));
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, youtubeVideoUrls: [...prev.youtubeVideoUrls, ''] }));
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Another YouTube URL
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter YouTube video URLs (optional, you can add multiple)
                    </p>
                  </div>

                  {/* Video Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Video Files (Max 5MB each, up to 10 videos)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Click to upload or drag and drop videos
                      </p>
                      <p className="text-xs text-gray-500">
                        MP4, MOV, AVI up to 5MB each (Multiple files allowed)
                      </p>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                        id="video-upload"
                        multiple
                      />
                      <label
                        htmlFor="video-upload"
                        className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                      >
                        Select Videos
                      </label>
                    </div>
                    
                    {/* Existing Videos */}
                    {existingVideos.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Existing Videos:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {existingVideos.map((videoUrl, index) => (
                            <div key={index} className="relative border border-gray-300 rounded-lg p-4">
                              <video
                                src={videoUrl}
                                controls
                                className="w-full max-h-48 rounded"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveExistingVideo(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* New Video Previews */}
                    {videoPreviews.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">New Videos:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {videoPreviews.map((preview, index) => (
                            <div key={index} className="relative border border-gray-300 rounded-lg p-4">
                              <video
                                src={preview}
                                controls
                                className="w-full max-h-48 rounded"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveVideo(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <p className="text-xs text-gray-500 mt-2 truncate">
                                {videoFiles[index]?.name} ({(videoFiles[index]?.size ? (videoFiles[index].size / 1024 / 1024).toFixed(2) : 0)} MB)
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Note: You can add a YouTube URL and/or upload multiple video files. All videos will be displayed.
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea name="productDescription" value={formData.productDescription} onChange={handleInputChange} rows={4} className="input-field w-full" required />
                </div>
                
                {/* Specifications */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                  <div className="space-y-3">
                    {formData.specifications.map((spec, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={spec.key}
                            onChange={(e) => {
                              const newSpecs = [...formData.specifications];
                              newSpecs[index].key = e.target.value;
                              setFormData(prev => ({ ...prev, specifications: newSpecs }));
                            }}
                            className="input-field w-full"
                            placeholder={`Specification key (e.g., Color, Size, Weight)`}
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={spec.value}
                            onChange={(e) => {
                              const newSpecs = [...formData.specifications];
                              newSpecs[index].value = e.target.value;
                              setFormData(prev => ({ ...prev, specifications: newSpecs }));
                            }}
                            className="input-field w-full"
                            placeholder={`Value (e.g., Red, Large, 500g)`}
                          />
                        </div>
                        {formData.specifications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newSpecs = formData.specifications.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, specifications: newSpecs }));
                            }}
                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                            title="Remove specification"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const cleanSpecs = formData.specifications.filter(s => s.key.trim() && s.value.trim());
                        setFormData(prev => ({ 
                          ...prev, 
                          specifications: [...cleanSpecs, { key: '', value: '' }] 
                        }));
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Specification
                    </button>
                  </div>
                </div>

                {/* Key Features */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Features</label>
                  <div className="space-y-3">
                    {formData.keyFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => {
                              const newFeatures = [...formData.keyFeatures];
                              newFeatures[index] = e.target.value;
                              setFormData(prev => ({ ...prev, keyFeatures: newFeatures }));
                            }}
                            className="input-field w-full"
                            placeholder={`Feature ${index + 1}`}
                          />
                        </div>
                        {formData.keyFeatures.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newFeatures = formData.keyFeatures.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, keyFeatures: newFeatures }));
                            }}
                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                            title="Remove feature"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const cleanFeatures = formData.keyFeatures.filter(f => f.trim());
                        setFormData(prev => ({ 
                          ...prev, 
                          keyFeatures: [...cleanFeatures, ''] 
                        }));
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Feature
                    </button>
                  </div>
                </div>

                {/* What's in Box */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">What's in the Box</label>
                  <div className="space-y-3">
                    {formData.whatsInBox.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const newItems = [...formData.whatsInBox];
                              newItems[index] = e.target.value;
                              setFormData(prev => ({ ...prev, whatsInBox: newItems }));
                            }}
                            className="input-field w-full"
                            placeholder={`Item ${index + 1}`}
                          />
                        </div>
                        {formData.whatsInBox.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = formData.whatsInBox.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, whatsInBox: newItems }));
                            }}
                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                            title="Remove item"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const cleanItems = formData.whatsInBox.filter(i => i.trim());
                        setFormData(prev => ({ 
                          ...prev, 
                          whatsInBox: [...cleanItems, ''] 
                        }));
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Pricing & Inventory Section */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Pricing & Inventory</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                    <input 
                      type="number" 
                      name="price" 
                      value={formData.price} 
                      onChange={handleInputChange} 
                      className="input-field w-full" 
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                      disabled={formData.isPreOrder}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount Price (₹)</label>
                    <input 
                      type="number" 
                      name="discountPrice" 
                      value={formData.discountPrice} 
                      onChange={(e) => {
                        const discountPrice = e.target.value;
                        const price = parseFloat(formData.price);
                        if (discountPrice && parseFloat(discountPrice) > price) {
                          toast.error('Discount price cannot be higher than regular price');
                          return;
                        }
                        handleInputChange(e);
                      }}
                      className="input-field w-full" 
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={formData.isPreOrder}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
                    <input 
                      type="number" 
                      name="stock" 
                      value={formData.stock} 
                      onChange={handleInputChange} 
                      className="input-field w-full" 
                      placeholder="0"
                      min="0"
                      required
                      disabled={formData.isPreOrder}
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPreOrder"
                      checked={formData.isPreOrder}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPreOrder: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Pre-order Available
                    </label>
                  </div>
                </div>
              </div>

              {/* Shipment Details */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipment Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Length (cm)</label>
                    <input 
                      type="number" 
                      name="shipmentLength" 
                      value={formData.shipmentLength} 
                      onChange={handleInputChange} 
                      className="input-field w-full" 
                      step="0.01" 
                      min="0" 
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Width (cm)</label>
                    <input 
                      type="number" 
                      name="shipmentWidth" 
                      value={formData.shipmentWidth} 
                      onChange={handleInputChange} 
                      className="input-field w-full" 
                      step="0.01" 
                      min="0" 
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                    <input 
                      type="number" 
                      name="shipmentHeight" 
                      value={formData.shipmentHeight} 
                      onChange={handleInputChange} 
                      className="input-field w-full" 
                      step="0.01" 
                      min="0" 
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight ({weightUnit})</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        name="shipmentWeight" 
                        value={formData.shipmentWeight} 
                        onChange={handleInputChange} 
                        className="input-field w-full pr-20" 
                        step={weightUnit === 'kg' ? "0.01" : "1"} 
                        min="0" 
                        placeholder={`0.00 ${weightUnit}`}
                      />
                      <select
                        value={weightUnit}
                        onChange={(e) => {
                          const newUnit = e.target.value as 'kg' | 'gm';
                          // Convert value when unit changes
                          if (formData.shipmentWeight) {
                            const currentValue = parseFloat(formData.shipmentWeight);
                            if (newUnit === 'gm' && weightUnit === 'kg') {
                              // Converting from kg to gm
                              setFormData(prev => ({ ...prev, shipmentWeight: (currentValue * 1000).toString() }));
                            } else if (newUnit === 'kg' && weightUnit === 'gm') {
                              // Converting from gm to kg
                              setFormData(prev => ({ ...prev, shipmentWeight: (currentValue / 1000).toString() }));
                            }
                          }
                          setWeightUnit(newUnit);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="kg">kg</option>
                        <option value="gm">gm</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">1 kg = 1000 gm</p>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Images</h2>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="btn-primary inline-block mt-2 cursor-pointer"
                    >
                      Choose Files
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Product ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Variants */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Product Variants</h2>
                  <button type="button" className="btn-primary" onClick={addVariant}>Add Variant</button>
                </div>

                {/* Variant Attributes Configuration */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Variant Attributes</h3>
                  <p className="text-sm text-gray-600 mb-4">Configure which attributes your product variants will have (e.g., Size, Color, Model)</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {variantAttributes.map((attr, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border">
                        <span className="text-sm font-medium text-gray-700 capitalize">{attr}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const attrToRemove = variantAttributes[index];
                            setVariantAttributes(prev => prev.filter((_, i) => i !== index));
                            // Remove from attribute values as well
                            setAttributeValues(prev => {
                              const newValues = { ...prev };
                              delete newValues[attrToRemove];
                              return newValues;
                            });
                            // Remove from raw input strings as well
                            setAttributeValueInputs(prev => {
                              const newInputs = { ...prev };
                              delete newInputs[attrToRemove];
                              return newInputs;
                            });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newAttribute}
                      onChange={(e) => setNewAttribute(e.target.value)}
                      placeholder="Add attribute (e.g., Material, Brand)"
                      className="input-field flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newAttribute.trim() && !variantAttributes.includes(newAttribute.toLowerCase())) {
                          const attrName = newAttribute.toLowerCase();
                          setVariantAttributes(prev => [...prev, attrName]);
                          // Initialize empty values for the new attribute
                          setAttributeValues(prev => ({
                            ...prev,
                            [attrName]: []
                          }));
                          // Initialize empty raw input string for the new attribute
                          setAttributeValueInputs(prev => ({
                            ...prev,
                            [attrName]: ''
                          }));
                          setNewAttribute('');
                        }
                      }}
                      className="btn-secondary px-4"
                    >
                      Add
                    </button>
                  </div>

                  {/* Attribute Values Configuration */}
                  {variantAttributes.length > 0 && (
                    <div className="mt-6 p-4 bg-white rounded-lg border">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Attribute Values</h4>
                      <p className="text-sm text-gray-600 mb-4">Configure the values for each attribute (e.g., Size: S, M, L)</p>
                      
                      <div className="space-y-4">
                        {variantAttributes.map((attr) => (
                          <div key={attr} className="flex items-center space-x-4">
                            <label className="text-sm font-medium text-gray-700 capitalize min-w-[80px]">{attr}:</label>
                            <input
                              type="text"
                              value={attributeValueInputs[attr] || ''}
                              onChange={(e) => {
                                const inputValue = e.target.value;
                                
                                // Store the raw input string (allows spaces while typing)
                                setAttributeValueInputs(prev => ({
                                  ...prev,
                                  [attr]: inputValue
                                }));
                                
                                // Also process and store as array for variant generation
                                const values = inputValue
                                  .split(',')
                                  .map(v => v.trim())
                                  .filter(v => v.length > 0);
                                
                                setAttributeValues(prev => ({
                                  ...prev,
                                  [attr]: values
                                }));
                              }}
                              placeholder={`Enter ${attr} values (e.g., 8GB, 16GB or S, M, L)`}
                              className="input-field flex-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Variants List */}
                {variants.length > 0 && (
                  <div className="space-y-4">
                    {variants.map((variant, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-gray-900">Variant {idx + 1}</h4>
                          <button 
                            type="button" 
                            className="text-red-600 hover:text-red-700" 
                            onClick={() => removeVariant(idx)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Basic Info */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Variant Name *</label>
                            <input 
                              type="text" 
                              value={variant.variantName} 
                              onChange={e => updateVariant(idx, 'variantName', e.target.value)} 
                              className="input-field w-full" 
                              placeholder="e.g., iPhone 15 Pro Max 256GB Blue"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                            <input 
                              type="text" 
                              value={variant.sku} 
                              onChange={e => updateVariant(idx, 'sku', e.target.value)} 
                              className="input-field w-full" 
                              placeholder="Unique SKU"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                            <input 
                              type="number" 
                              value={variant.stock} 
                              onChange={e => updateVariant(idx, 'stock', e.target.value)} 
                              className="input-field w-full" 
                              placeholder="0"
                            />
                          </div>
                          
                          {/* Pricing */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                            <input 
                              type="number" 
                              value={variant.price} 
                              onChange={e => updateVariant(idx, 'price', e.target.value)} 
                              className="input-field w-full" 
                              placeholder="0.00"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Price (₹)</label>
                            <input 
                              type="number" 
                              value={variant.discountPrice || ''} 
                              onChange={e => updateVariant(idx, 'discountPrice', e.target.value)} 
                              className="input-field w-full" 
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        {/* Dynamic Attributes */}
                        {variantAttributes.length > 0 && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Attributes</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {variantAttributes.map((attr) => {
                                const availableValues = attributeValues[attr] || [];
                                const isColor = attr.toLowerCase() === 'color' || attr.toLowerCase() === 'colour';
                                const hexKey = `${attr}Hex`;
                                const hexValue = variant.attributes?.[hexKey] || '';
                                
                                return (
                                  <div key={attr}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{attr}</label>
                                    {availableValues.length > 0 ? (
                                      <div className="space-y-2">
                                        <select
                                          value={variant.attributes?.[attr] || ''}
                                          onChange={e => updateVariantAttribute(idx, attr, e.target.value)}
                                          className="input-field w-full"
                                        >
                                          <option value="">Select {attr}</option>
                                          {availableValues.map((value) => (
                                            <option key={value} value={value}>
                                              {value}
                                            </option>
                                          ))}
                                        </select>
                                        {isColor && (
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="color"
                                              value={hexValue || '#000000'}
                                              onChange={e => updateVariantAttributeHex(idx, attr, e.target.value)}
                                              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                              title="Select color"
                                            />
                                            <input
                                              type="text"
                                              value={hexValue || ''}
                                              onChange={e => {
                                                const value = e.target.value;
                                                if (value === '' || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                                                  updateVariantAttributeHex(idx, attr, value);
                                                }
                                              }}
                                              placeholder="#000000"
                                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                              maxLength={7}
                                            />
                                            {hexValue && (
                                              <div
                                                className="w-8 h-8 border border-gray-300 rounded"
                                                style={{ backgroundColor: hexValue }}
                                                title={hexValue}
                                              />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <input 
                                          type="text" 
                                          value={variant.attributes?.[attr] || ''} 
                                          onChange={e => updateVariantAttribute(idx, attr, e.target.value)} 
                                          className="input-field w-full" 
                                          placeholder={`Enter ${attr} (no values configured)`}
                                        />
                                        {isColor && (
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="color"
                                              value={hexValue || '#000000'}
                                              onChange={e => updateVariantAttributeHex(idx, attr, e.target.value)}
                                              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                              title="Select color"
                                            />
                                            <input
                                              type="text"
                                              value={hexValue || ''}
                                              onChange={e => {
                                                const value = e.target.value;
                                                if (value === '' || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                                                  updateVariantAttributeHex(idx, attr, value);
                                                }
                                              }}
                                              placeholder="#000000"
                                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                              maxLength={7}
                                            />
                                            {hexValue && (
                                              <div
                                                className="w-8 h-8 border border-gray-300 rounded"
                                                style={{ backgroundColor: hexValue }}
                                                title={hexValue}
                                              />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {variants.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No variants added yet. Click "Add Variant" to create product variants.</p>
                  </div>
                )}
              </div>

              {/* Frequently Bought Together */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Frequently Bought Together</h2>
                
                <div className="space-y-4">
                  {/* Product Search */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Products to Add
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={productSearchQuery}
                        onChange={handleProductSearchChange}
                        onFocus={() => {
                          if (productSearchQuery.length >= 2) {
                            setShowProductSearch(true);
                          }
                        }}
                        placeholder="Type product name to search..."
                        className="input-field w-full pr-10"
                      />
                      {productSearchLoading && (
                        <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showProductSearch && productSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {productSearchResults.map((product) => (
                          <div
                            key={product._id}
                            onClick={() => addToFrequentlyBoughtTogether(product)}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{product.productName}</p>
                                <p className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-sm font-semibold text-green-600">
                                  ₹{Math.round(getProductPrice(product)).toLocaleString()}
                                </p>
                                {product.discountPrice && product.price && (
                                  <p className="text-xs text-gray-400 line-through">
                                    ₹{Math.round(product.price).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No Results Message */}
                    {showProductSearch && productSearchQuery.length >= 2 && !productSearchLoading && productSearchResults.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                        <p className="text-sm text-gray-500">No products found</p>
                      </div>
                    )}
                  </div>

                  {/* Selected Products */}
                  {frequentlyBoughtTogether.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Products ({frequentlyBoughtTogether.length})
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {frequentlyBoughtTogether.map((product) => (
                          <div
                            key={product._id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {product.productName}
                                </h4>
                                {product.sku && (
                                  <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
                                )}
                                <div className="mt-2">
                                  <p className="text-lg font-semibold text-green-600">
                                    ₹{Math.round(getProductPrice(product)).toLocaleString()}
                                  </p>
                                  {product.discountPrice && product.price && (
                                    <p className="text-xs text-gray-400 line-through">
                                      ₹{Math.round(product.price).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromFrequentlyBoughtTogether(product._id)}
                                className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                                title="Remove product"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                            {product.images && product.images.length > 0 && (
                              <div className="mt-3">
                                <img
                                  src={product.images[0]}
                                  alt={product.productName}
                                  className="w-full h-24 object-cover rounded"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {frequentlyBoughtTogether.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        No products added yet. Search and select products above.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Buttons at the bottom of the form */}
          <div className="flex justify-end gap-4 mt-8">
            <button type="submit" disabled={saving} className="btn-primary py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Updating Product...' : 'Update Product'}
            </button>
            <Link href="/products" className="btn-secondary py-3 px-6 text-center block">Cancel</Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 