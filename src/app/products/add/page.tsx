'use client';

export const dynamic = 'force-dynamic';

import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, X, Upload, Trash2, Download, FileText, AlertCircle, CheckCircle, XCircle, RefreshCw, Search, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getApiUrl, getAuthHeaders, getFormDataHeaders } from '@/lib/config';
import { 
  validateVariant, 
  formatVariantName,
  Variant 
} from '@/lib/variantService';

export default function AddProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'export'>('single');
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  
  // Bulk import states
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkImportResult, setBulkImportResult] = useState<any>(null);
  const [bulkDragActive, setBulkDragActive] = useState(false);
  const [bulkCategories, setBulkCategories] = useState<any>(null);
  const [bulkSampleData, setBulkSampleData] = useState<any[]>([]);
  const [bulkLoadingCategories, setBulkLoadingCategories] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  
  // Bulk export states
  const [productCount, setProductCount] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [loadingCount, setLoadingCount] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    productTitle: '',
    productDescription: '',
    category: '',
    subcategory: '',
    sku: '',
    unit: '',
    price: '',
    discountPrice: '',
    stock: '',
    isActive: true,
    isPreOrder: false,
    modelNumber: '',
    brandName: '',
    manufacturerPartNumber: '',
    eanCode: '',
    // 3D Model field
    splineModelUrl: '',
    // Video fields
    youtubeVideoUrls: [''],
    // Product details fields
    keyFeatures: [''],
    whatsInBox: [''],
    specifications: [{ key: '', value: '' }],
    // Shipment fields
    shipmentLength: '',
    shipmentWidth: '',
    shipmentHeight: '',
    shipmentWeight: '',
  });
  const [weightUnit, setWeightUnit] = useState<'kg' | 'gm'>('kg');
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
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
  
  // Manual product add states
  const [showManualProductModal, setShowManualProductModal] = useState(false);
  const [manualProduct, setManualProduct] = useState({
    productName: '',
    price: '',
    discountPrice: '',
    image: null as File | null,
    imagePreview: '' as string
  });

  useEffect(() => {
    // Fetch categories
    fetch(getApiUrl('/web/categories'), {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        console.log('Categories response:', data);
        setCategories(data.data || []);
      })
      .catch(error => {
        toast.error('Failed to load categories');
      });
    
    // Fetch subcategories
    fetch(getApiUrl('/web/subcategories'), {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        console.log('Subcategories response:', data);
        setSubcategories(data.data || []);
      })
      .catch(error => {
        toast.error('Failed to load subcategories');
      });
    
    // Initialize form with at least one empty row for dynamic fields
    setFormData(prev => ({
      ...prev,
      keyFeatures: [''],
      whatsInBox: [''],
      specifications: [{ key: '', value: '' }]
    }));
  }, []);

  // Fetch bulk import categories and sample data
  const fetchBulkImportData = async () => {
    setBulkLoadingCategories(true);
    try {
      const response = await fetch(getApiUrl('/admin/products/categories-for-import'), {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          setBulkCategories(data.data);
          
          // Generate dynamic sample data based on available categories
          if (data.data.categories && data.data.categories.length > 0) {
            const sampleData = [];
            const firstCategory = data.data.categories[0];
            const firstSubcategory = data.data.subcategories.find((sub: any) => sub.category === firstCategory);
            
            // Sample 1
            sampleData.push({
              productName: 'Sample Product 1',
              productTitle: 'Sample Product 1 - Premium Quality',
              category: firstCategory,
              subcategory: firstSubcategory ? firstSubcategory.name : '',
              price: '999.99',
              stock: '50',
              sku: `${firstCategory.substring(0, 4).toUpperCase()}-123456-ABC`,
              splineModelUrl: 'https://prod.spline.design/ypAIlAtpoKQ-4LGI/scene.splinecode',
              brandName: 'Sample Brand',
              modelNumber: 'SAMPLE-001',
              manufacturerPartNumber: 'SMP-001-A',
              shipmentLength: '30.5',
              shipmentWidth: '20.3',
              shipmentHeight: '15.2',
              shipmentWeight: '1.5',
              shipmentWeightUnit: 'kg',
              youtubeVideoUrls: 'https://www.youtube.com/watch?v=example1,https://www.youtube.com/watch?v=example2',
              productVideos: 'https://cloudinary.com/video1.mp4,https://cloudinary.com/video2.mp4',
              frequentlyBoughtTogether: 'PRODUCT_ID_1,PRODUCT_ID_2',
              variants: JSON.stringify([
                { 
                  variantName: 'Sample Product 1 - Premium Quality (128GB) Red', 
                  stock: 25, 
                  price: '999.99',
                  discountPrice: '899.99',
                  sku: `${firstCategory.substring(0, 4).toUpperCase()}-123456-ABC-RED`,
                  attributes: { size: '128GB', color: 'Red' }
                },
                { 
                  variantName: 'Sample Product 1 - Premium Quality (256GB) Blue', 
                  stock: 25, 
                  price: '1099.99',
                  discountPrice: '999.99',
                  sku: `${firstCategory.substring(0, 4).toUpperCase()}-123456-ABC-BLUE`,
                  attributes: { size: '256GB', color: 'Blue' }
                }
              ]),
              specifications: 'Color:Red,Size:Large,Weight:500g'
            });

            // Sample 2 (if we have more categories)
            if (data.data.categories.length > 1) {
              const secondCategory = data.data.categories[1];
              const secondSubcategory = data.data.subcategories.find((sub: any) => sub.category === secondCategory);
              
              sampleData.push({
                productName: 'Sample Product 2',
                productTitle: 'Sample Product 2 - Advanced Features',
                category: secondCategory,
                subcategory: secondSubcategory ? secondSubcategory.name : '',
                price: '899.99',
                stock: '30',
                sku: `${secondCategory.substring(0, 4).toUpperCase()}-789012-DEF`,
                splineModelUrl: 'https://prod.spline.design/ypAIlAtpoKQ-4LGI/scene.splinecode',
                brandName: 'Premium Brand',
                modelNumber: 'PREMIUM-002',
                manufacturerPartNumber: 'PRM-002-B',
                shipmentLength: '25.0',
                shipmentWidth: '18.5',
                shipmentHeight: '12.0',
                shipmentWeight: '0.8',
                shipmentWeightUnit: 'kg',
                youtubeVideoUrls: 'https://www.youtube.com/watch?v=example3',
                productVideos: 'https://cloudinary.com/video3.mp4',
                frequentlyBoughtTogether: 'PRODUCT_ID_3',
                variants: JSON.stringify([
                  { 
                    variantName: 'Sample Product 2 - Advanced Features (Small) Black', 
                    stock: 15, 
                    price: '899.99',
                    discountPrice: '799.99',
                    sku: `${secondCategory.substring(0, 4).toUpperCase()}-789012-DEF-BLACK`,
                    attributes: { size: 'Small', color: 'Black' }
                  },
                  { 
                    variantName: 'Sample Product 2 - Advanced Features (Large) White', 
                    stock: 15, 
                    price: '999.99',
                    discountPrice: '899.99',
                    sku: `${secondCategory.substring(0, 4).toUpperCase()}-789012-DEF-WHITE`,
                    attributes: { size: 'Large', color: 'White' }
                  }
                ]),
                specifications: 'Material:Plastic,Type:Premium,Features:Advanced'
              });
            }

            setBulkSampleData(sampleData);
          } else {
            toast.error('No categories found. Please add categories first.');
          }
        } else {
          toast.error(data.message || 'Failed to load categories for import');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || `Failed to load categories (${response.status})`);
      }
    } catch (error) {
      toast.error('Network error: Failed to load categories for import');
    } finally {
      setBulkLoadingCategories(false);
    }
  };

  // Fetch bulk import data when bulk tab is selected
  useEffect(() => {
    if (activeTab === 'bulk' && !bulkCategories) {
      fetchBulkImportData();
    }
  }, [activeTab, bulkCategories]);

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
        // Filter out products that are already selected
        const selectedIds = frequentlyBoughtTogether.map(p => p._id);
        const filtered = data.data.filter((product: any) => !selectedIds.includes(product._id));
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

  // Handle manual product input change
  const handleManualProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle manual product image upload
  const handleManualProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5MB
      
      // Validate file size (max 5MB per file)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      // Check total size including new manual product image
      const currentTotal = calculateTotalFileSize();
      const existingManualImageSize = manualProduct.image ? manualProduct.image.size : 0;
      const newFileSize = file.size;
      const newTotal = currentTotal - existingManualImageSize + newFileSize;
      
      if (newTotal > MAX_TOTAL_SIZE) {
        const currentMB = (currentTotal / 1024 / 1024).toFixed(2);
        const newMB = (newTotal / 1024 / 1024).toFixed(2);
        toast.error(`Total upload size will be ${newMB}MB, which exceeds the maximum limit of 5MB. Current total: ${currentMB}MB`);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setManualProduct(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Add manual product to Frequently Bought Together
  const addManualProduct = () => {
    if (!manualProduct.productName.trim()) {
      toast.error('Please enter product name');
      return;
    }
    if (!manualProduct.price || parseFloat(manualProduct.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    // Create manual product object with base64 image if available
    const manualProductData: any = {
      _id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
      productName: manualProduct.productName.trim(),
      price: parseFloat(manualProduct.price),
      discountPrice: manualProduct.discountPrice ? parseFloat(manualProduct.discountPrice) : undefined,
      images: manualProduct.imagePreview ? [manualProduct.imagePreview] : [],
      imageFile: manualProduct.image, // Store file for form submission
      sku: `MANUAL-${Date.now()}`,
      isManual: true // Flag to identify manual products
    };

    setFrequentlyBoughtTogether(prev => [...prev, manualProductData]);
    
    // Reset form
    setManualProduct({
      productName: '',
      price: '',
      discountPrice: '',
      image: null,
      imagePreview: ''
    });
    setShowManualProductModal(false);
    toast.success('Product added to Frequently Bought Together');
  };

  // Get current price for display
  const getProductPrice = (product: any) => {
    return product.discountPrice || product.price || 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Special validation for price and discount price
    if (name === 'price') {
      const numValue = parseFloat(value);
      if (numValue < 0) {
        toast.error('Price cannot be negative');
        return;
      }
      // If discount price exists and is higher than new price, clear discount price
      if (formData.discountPrice && parseFloat(formData.discountPrice) > numValue) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          discountPrice: ''
        }));
        toast.error('Discount price cannot be higher than regular price. Discount price has been cleared.');
        return;
      }
    }
    
    if (name === 'discountPrice') {
      const numValue = parseFloat(value);
      if (numValue < 0) {
        toast.error('Discount price cannot be negative');
        return;
      }
      if (formData.price && numValue > parseFloat(formData.price)) {
        toast.error('Discount price cannot be higher than regular price');
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
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
    
    // Variant images
    Object.values(variantImageFiles).forEach(file => {
      if (file) totalSize += file.size;
    });
    
    // Manual product images (from frequently bought together)
    frequentlyBoughtTogether.forEach((product: any) => {
      if (product.isManual && product.imageFile) {
        totalSize += product.imageFile.size;
      }
    });
    
    return totalSize;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5MB
      
      // Check individual file sizes
      newFiles.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Max size is 5MB per file.`);
          return;
        }
      });
      
      // Calculate total size including new files
      const currentTotal = calculateTotalFileSize();
      const newFilesSize = newFiles.reduce((sum, file) => sum + file.size, 0);
      const newTotal = currentTotal + newFilesSize;
      
      if (newTotal > MAX_TOTAL_SIZE) {
        const currentMB = (currentTotal / 1024 / 1024).toFixed(2);
        const newMB = (newTotal / 1024 / 1024).toFixed(2);
        toast.error(`Total upload size will be ${newMB}MB, which exceeds the maximum limit of 5MB. Current total: ${currentMB}MB`);
        return;
      }
      
      setImageFiles(prev => [...prev, ...newFiles]);
      
      // Create preview URLs for immediate display
      const newImages = newFiles.map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
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

  // Function to validate YouTube URL
  const isValidYouTubeUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid (optional field)
    const patterns = [
      /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/,
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  // Variant handlers
  const addVariant = () => {
    const newVariant: Variant & { id?: string } = {
      variantName: '',
      price: 0,
      stock: 0,
      sku: '',
      attributes: {},
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9) // Unique ID for React key
    };
    setVariants(prev => [...prev, newVariant]);
  };
  
  // Helper function to build enhanced productTitle with variant attributes
  const buildVariantProductTitle = (variant: Variant): string => {
    const baseTitle = formData.productTitle || formData.productName || '';
    
    // Get all variant attribute values, separating color from other attributes
    const colorAttributes: string[] = [];
    const otherAttributes: string[] = [];
    
    if (variant.attributes) {
      Object.entries(variant.attributes).forEach(([key, value]) => {
        if (value && value.trim()) {
          const lowerKey = key.toLowerCase();
          const lowerValue = value.toLowerCase();
          // Check if it's a color attribute (common color names or key contains 'color')
          const isColor = lowerKey.includes('color') || lowerKey.includes('colour') ||
                         ['red', 'blue', 'green', 'yellow', 'black', 'white', 'silver', 'gold', 
                          'gray', 'grey', 'pink', 'purple', 'orange', 'brown', 'navy', 'beige'].some(color => 
                          lowerValue.includes(color));
          
          if (isColor) {
            colorAttributes.push(value.trim());
          } else {
            otherAttributes.push(value.trim());
          }
        }
      });
    }
    
    // If no attributes, return base title or variant name
    if (colorAttributes.length === 0 && otherAttributes.length === 0) {
      return variant.variantName || baseTitle;
    }
    
    // Build enhanced title
    let enhancedTitle = baseTitle;
    
    if (baseTitle) {
      // Check if base title already has parentheses
      const lastParenIndex = baseTitle.lastIndexOf(')');
      const hasParentheses = lastParenIndex > 0 && baseTitle.includes('(');
      
      if (hasParentheses && otherAttributes.length > 0) {
        // Insert other attributes (RAM, Storage, etc.) before the closing parenthesis
        const otherAttrsStr = otherAttributes.join(', ');
        enhancedTitle = baseTitle.slice(0, lastParenIndex) + `, ${otherAttrsStr})`;
      } else if (otherAttributes.length > 0) {
        // Add other attributes in new parentheses
        const otherAttrsStr = otherAttributes.join(', ');
        enhancedTitle = `${baseTitle} (${otherAttrsStr})`;
      }
      
      // Append color attributes at the end (outside parentheses)
      if (colorAttributes.length > 0) {
        const colorStr = colorAttributes.join(', ');
        enhancedTitle = `${enhancedTitle} ${colorStr}`;
      }
    } else {
      // If no base title, use variant name with attributes
      const allAttributes = [...otherAttributes, ...colorAttributes];
      const attrsStr = allAttributes.join(', ');
      enhancedTitle = variant.variantName ? `${variant.variantName} (${attrsStr})` : attrsStr;
    }
    
    return enhancedTitle.trim();
  };
  

  const updateVariant = (idx: number, field: string, value: string) => {
    setVariants(prev => {
      const updatedVariants = [...prev];
      
      // Create a new object for the variant being updated to ensure React detects the change
      const updatedVariant = { ...updatedVariants[idx] };
      
      if (field === 'price' || field === 'discountPrice' || field === 'stock') {
        const numValue = parseFloat(value);
        if (numValue < 0) {
          toast.error(`${field} cannot be negative`);
          return prev; // Return previous state if validation fails
        }
        
        // Price validation for variants
        if (field === 'price') {
          const price = numValue;
          if (updatedVariant.discountPrice && updatedVariant.discountPrice > price) {
            updatedVariant.discountPrice = undefined;
            toast.error('Variant discount price cannot be higher than regular price. Discount price has been cleared.');
          }
        }
        
        if (field === 'discountPrice') {
          const discountPrice = numValue;
          const price = updatedVariant.price;
          if (discountPrice > price) {
            toast.error('Variant discount price cannot be higher than regular price');
            return prev; // Return previous state if validation fails
          }
        }
        
        (updatedVariant as any)[field] = numValue;
      } else {
        (updatedVariant as any)[field] = value;
      }
      
      updatedVariants[idx] = updatedVariant;
      return updatedVariants;
    });
  };
  
  const removeVariant = (idx: number) => {
    setVariants(prev => prev.filter((_, i) => i !== idx));
  };


  // Helper function to ensure at least one empty row exists for dynamic fields
  const ensureEmptyRow = (fieldName: 'keyFeatures' | 'whatsInBox' | 'specifications') => {
    const currentValue = formData[fieldName];
    if (fieldName === 'specifications') {
      const specs = currentValue as { key: string; value: string }[];
      if (specs.length === 0 || specs.every(s => s.key.trim() && s.value.trim())) {
        setFormData(prev => ({
          ...prev,
          specifications: [...specs, { key: '', value: '' }]
        }));
      }
    } else {
      const items = currentValue as string[];
      if (items.length === 0 || items.every(item => item.trim())) {
        setFormData(prev => ({
          ...prev,
          [fieldName]: [...items, '']
        }));
      }
    }
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



  // Handle variant image file selection
  const [variantImageFiles, setVariantImageFiles] = useState<{ [key: number]: File }>({});
  
  const handleVariantImageChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5MB
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB per file)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      // Check if replacing existing variant image
      const existingFile = variantImageFiles[idx];
      const currentTotal = calculateTotalFileSize();
      const newFileSize = file.size;
      const existingFileSize = existingFile ? existingFile.size : 0;
      const newTotal = currentTotal - existingFileSize + newFileSize;
      
      if (newTotal > MAX_TOTAL_SIZE) {
        const currentMB = (currentTotal / 1024 / 1024).toFixed(2);
        const newMB = (newTotal / 1024 / 1024).toFixed(2);
        toast.error(`Total upload size will be ${newMB}MB, which exceeds the maximum limit of 5MB. Current total: ${currentMB}MB`);
        return;
      }
      
      // Store the file for upload
      setVariantImageFiles(prev => ({ ...prev, [idx]: file }));
      
      // Show preview
      const imageUrl = URL.createObjectURL(file);
      updateVariant(idx, 'image', imageUrl);
    }
  };

  // Bulk import functions
  const handleBulkFileSelect = (selectedFile: File) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Please select a valid CSV or Excel file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size should be less than 10MB');
      return;
    }

    setBulkFile(selectedFile);
    setBulkImportResult(null);
  };

  const handleBulkDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setBulkDragActive(true);
    } else if (e.type === 'dragleave') {
      setBulkDragActive(false);
    }
  };

  const handleBulkDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBulkDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleBulkFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setBulkUploading(true);
    const formData = new FormData();
    formData.append('file', bulkFile);

    try {
      const response = await fetch(getApiUrl('/admin/products/bulk-import'), {
        method: 'POST',
        headers: {
          'Authorization': (getAuthHeaders() as any).Authorization || '',
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setBulkImportResult(data.data);
        setBulkFile(null);
        if (bulkFileInputRef.current) {
          bulkFileInputRef.current.value = '';
        }
        toast.success(`Bulk import completed! ${data.data.successful} products imported successfully.`);
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setBulkUploading(false);
    }
  };

  const downloadBulkTemplate = async () => {
    try {
      const response = await fetch(getApiUrl('/admin/products/import-template'), {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'product_import_template.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Template downloaded successfully!');
      } else {
        toast.error('Failed to download template');
      }
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const resetBulkForm = () => {
    setBulkFile(null);
    setBulkImportResult(null);
    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = '';
    }
  };

  // Fetch product count when export tab is selected
  const fetchProductCount = async () => {
    try {
      setLoadingCount(true);
      const response = await fetch(getApiUrl('/admin/products/count'), {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setProductCount(data.data);
      }
    } catch (error) {
      toast.error('Failed to load product count');
    } finally {
      setLoadingCount(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'export') {
      fetchProductCount();
    }
  }, [activeTab]);

  // Export products to CSV
  const handleExportProducts = async () => {
    try {
      setExporting(true);
      const response = await fetch(getApiUrl('/admin/products/export'), {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Products exported successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to export products');
      }
    } catch (error) {
      toast.error('Failed to export products. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up form data by removing empty entries
    const cleanFormData = {
      ...formData,
      keyFeatures: formData.keyFeatures.filter(f => f.trim()),
      whatsInBox: formData.whatsInBox.filter(w => w.trim()),
      specifications: formData.specifications.filter(s => s.key.trim() && s.value.trim())
    };
    
    // Validate price and discount price before submission (skip for pre-order products)
    if (!cleanFormData.isPreOrder) {
      const price = parseFloat(cleanFormData.price);
      const discountPrice = cleanFormData.discountPrice ? parseFloat(cleanFormData.discountPrice) : 0;
      
      if (!cleanFormData.price || price <= 0) {
        toast.error('Valid price is required');
        return;
      }
      
      if (price < 0) {
        toast.error('Price cannot be negative');
        return;
      }
      
      if (discountPrice < 0) {
        toast.error('Discount price cannot be negative');
        return;
      }
      
      if (discountPrice > price) {
        toast.error('Discount price cannot be higher than regular price');
        return;
      }
    }
    
    // Validate variant prices
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const variantPrice = variant.price;
      const variantDiscountPrice = variant.discountPrice || 0;
      
      if (variantPrice < 0) {
        toast.error(`Variant ${i + 1} price cannot be negative`);
        return;
      }
      
      if (variantDiscountPrice < 0) {
        toast.error(`Variant ${i + 1} discount price cannot be higher than regular price`);
        return;
      }
      
      if (variantDiscountPrice > variantPrice) {
        toast.error(`Variant ${i + 1} discount price cannot be higher than regular price`);
        return;
      }
    }
    
    // Validate specifications
    const validSpecifications = cleanFormData.specifications.filter(spec => spec.key.trim() && spec.value.trim());
    if (cleanFormData.specifications.length > 0 && validSpecifications.length === 0) {
      toast.error('Please provide valid specifications with both key and value');
      return;
    }
    
    setLoading(true);
    setUploadingImages(true);
    
    try {
      // Create FormData for multipart/form-data submission
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append('productName', cleanFormData.productName);
      formDataToSend.append('productTitle', cleanFormData.productTitle);
      formDataToSend.append('productDescription', cleanFormData.productDescription);
      formDataToSend.append('category', cleanFormData.category);
      formDataToSend.append('subcategory', cleanFormData.subcategory);
      formDataToSend.append('sku', cleanFormData.sku);
      formDataToSend.append('unit', cleanFormData.unit);
      formDataToSend.append('price', cleanFormData.price);
      formDataToSend.append('discountPrice', cleanFormData.discountPrice);
      formDataToSend.append('stock', cleanFormData.stock);
      formDataToSend.append('isActive', cleanFormData.isActive.toString());
      formDataToSend.append('isPreOrder', cleanFormData.isPreOrder.toString());
      
      formDataToSend.append('modelNumber', cleanFormData.modelNumber);
      formDataToSend.append('brandName', cleanFormData.brandName);
      formDataToSend.append('manufacturerPartNumber', cleanFormData.manufacturerPartNumber);
      formDataToSend.append('eanCode', cleanFormData.eanCode);
      
      // Add 3D Model URL
      formDataToSend.append('splineModelUrl', cleanFormData.splineModelUrl);
      
      // Add shipment fields
      if (cleanFormData.shipmentLength) {
        formDataToSend.append('shipmentLength', cleanFormData.shipmentLength);
      }
      if (cleanFormData.shipmentWidth) {
        formDataToSend.append('shipmentWidth', cleanFormData.shipmentWidth);
      }
      if (cleanFormData.shipmentHeight) {
        formDataToSend.append('shipmentHeight', cleanFormData.shipmentHeight);
      }
      if (cleanFormData.shipmentWeight) {
        // Convert to kg if unit is gm
        let weightValue = parseFloat(cleanFormData.shipmentWeight);
        if (weightUnit === 'gm') {
          weightValue = weightValue / 1000; // Convert gm to kg
        }
        formDataToSend.append('shipmentWeight', weightValue.toString());
      }
      
      // Add product details
      formDataToSend.append('keyFeatures', JSON.stringify(cleanFormData.keyFeatures));
      formDataToSend.append('whatsInBox', JSON.stringify(cleanFormData.whatsInBox));
      formDataToSend.append('specifications', JSON.stringify(cleanFormData.specifications));
      
      // Add images
      if (imageFiles.length > 0) {
        imageFiles.forEach((file, index) => {
          formDataToSend.append('images', file);
        });
      }

      // Add video files (multiple)
      if (videoFiles.length > 0) {
        videoFiles.forEach(file => {
          formDataToSend.append('productVideos', file);
        });
      }

      // Add YouTube video URLs (multiple)
      const validYouTubeUrls = cleanFormData.youtubeVideoUrls.filter(url => url.trim() !== '');
      if (validYouTubeUrls.length > 0) {
        // Validate all YouTube URLs
        for (const url of validYouTubeUrls) {
          if (!isValidYouTubeUrl(url)) {
            toast.error(`Invalid YouTube URL: ${url}`);
            setUploadingImages(false);
            return;
          }
        }
        formDataToSend.append('youtubeVideoUrls', JSON.stringify(validYouTubeUrls));
      }
      
      // Add variant images if any
      Object.keys(variantImageFiles).forEach((idxStr) => {
        const idx = parseInt(idxStr);
        const file = variantImageFiles[idx];
        if (file && variants[idx]) {
          formDataToSend.append(`variantImages`, file);
          formDataToSend.append(`variantImageIndices`, idx.toString());
        }
      });
      
      // Add variants as JSON string (images will be set from uploaded URLs)
      formDataToSend.append('variants', JSON.stringify(variants));
      
      // Add Frequently Bought Together products
      // Separate manual products and regular products
      const regularProducts = frequentlyBoughtTogether.filter(p => !p.isManual);
      const manualProducts = frequentlyBoughtTogether.filter(p => p.isManual);
      
      const frequentlyBoughtTogetherIds = regularProducts.map(p => p._id);
      formDataToSend.append('frequentlyBoughtTogether', JSON.stringify(frequentlyBoughtTogetherIds));
      
      // Add manual products with their full data
      if (manualProducts.length > 0) {
        // Prepare manual products data with base64 images
        const manualProductsData = manualProducts.map((product: any) => {
          return {
            productName: product.productName,
            price: product.price,
            discountPrice: product.discountPrice,
            images: product.images || [], // Contains base64 or URL
            imageBase64: product.imagePreview || '', // Base64 image data
            sku: product.sku,
            isManual: true
          };
        });
        
        formDataToSend.append('manualFrequentlyBoughtTogether', JSON.stringify(manualProductsData));
        
        // Also add image files separately if available (for backend processing)
        const manualProductImageIndices: string[] = [];
        manualProducts.forEach((product: any, index: number) => {
          if (product.imageFile) {
            formDataToSend.append(`manualProductImages`, product.imageFile);
            manualProductImageIndices.push(index.toString());
          }
        });
        // Send indices as array
        if (manualProductImageIndices.length > 0) {
          manualProductImageIndices.forEach(index => {
            formDataToSend.append('manualProductImageIndex', index);
          });
        }
      }
      
      const response = await fetch(getApiUrl('/web/products'), {
        method: 'POST',
        headers: getFormDataHeaders(),
        body: formDataToSend,
      });
      
      if (response.ok) {
        toast.success('Product added successfully!');
        router.push('/products');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add product');
      }
    } catch (error) {
      toast.error('Failed to add product. Please try again.');
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: 'Products', href: '/products' },
          { label: 'Add Product' }
        ]} />
        
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Product</h1>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('single')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'single'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Single Product
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bulk'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bulk Import
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'export'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bulk Export
              </button>
            </nav>
          </div>
        </div>

        {/* Single Product Form */}
        {activeTab === 'single' && (
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
                      {subcategories.filter(sc => sc.category?._id === formData.category).map((sc) => (
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
                    
                    {/* Video Previews */}
                    {videoPreviews.length > 0 && (
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
                    )}
                  
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
                              ensureEmptyRow('specifications');
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
                        // Remove empty specifications before adding new one
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
                            placeholder={`Feature ${index + 1} (e.g., High Quality, Durable, Fast Performance)`}
                          />
                        </div>
                        {formData.keyFeatures.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newFeatures = formData.keyFeatures.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, keyFeatures: newFeatures }));
                              ensureEmptyRow('keyFeatures');
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
                        // Remove empty features before adding new one
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

                {/* What's in the Box */}
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
                            placeholder={`Item ${index + 1} (e.g., Product, Manual, Warranty Card, Cable)`}
                          />
                        </div>
                        {formData.whatsInBox.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = formData.whatsInBox.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, whatsInBox: newItems }));
                              ensureEmptyRow('whatsInBox');
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
                        // Remove empty items before adding new one
                        const cleanItems = formData.whatsInBox.filter(w => w.trim());
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

              {/* Variants */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Product Variants</h2>
                  <div className="flex space-x-2">
                    <button type="button" className="btn-primary" onClick={addVariant}>Add Variant</button>
                  </div>
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
                  
                  <div className="flex space-x-2 mb-4">
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
                        {variantAttributes.map((attr) => {
                          const isColor = attr.toLowerCase() === 'color' || attr.toLowerCase() === 'colour';
                          
                          return (
                            <div key={attr} className="flex items-center space-x-4">
                              <label className="text-sm font-medium text-gray-700 capitalize min-w-[80px]">{attr}:</label>
                              <div className="flex items-center gap-2 flex-1">
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
                                  placeholder={isColor 
                                    ? `Enter color names or select hex codes (e.g., Red, Blue, Green)` 
                                    : `Enter ${attr} values (e.g., 8GB, 16GB or S, M, L)`}
                                  className="input-field flex-1"
                                />
                                {isColor && (
                                  <input
                                    type="color"
                                    onChange={(e) => {
                                      const hexCode = e.target.value;
                                      const currentValue = attributeValueInputs[attr] || '';
                                      
                                      // Add hex code to the input field
                                      const newValue = currentValue 
                                        ? `${currentValue}, ${hexCode}`
                                        : hexCode;
                                      
                                      setAttributeValueInputs(prev => ({
                                        ...prev,
                                        [attr]: newValue
                                      }));
                                      
                                      // Process and store as array
                                      const values = newValue
                                        .split(',')
                                        .map(v => v.trim())
                                        .filter(v => v.length > 0);
                                      
                                      setAttributeValues(prev => ({
                                        ...prev,
                                        [attr]: values
                                      }));
                                    }}
                                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                    title="Select hex color code"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Variants List */}
                {variants.length > 0 && (
                  <div className="space-y-4">
                    {variants.map((variant, idx) => (
                      <div key={(variant as any).id || idx} className="border border-gray-200 rounded-lg p-6">
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

                        {/* Variant Image Upload */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Variant Image</label>
                          <div className="flex items-center gap-4">
                            {variant.image ? (
                              <div className="relative">
                                <img 
                                  src={variant.image} 
                                  alt={`Variant ${idx + 1} preview`}
                                  className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Revoke object URL if it's a blob URL
                                    if (variant.image && variant.image.startsWith('blob:')) {
                                      URL.revokeObjectURL(variant.image);
                                    }
                                    updateVariant(idx, 'image', '');
                                    // Remove file from state as well
                                    setVariantImageFiles(prev => {
                                      const updated = { ...prev };
                                      delete updated[idx];
                                      return updated;
                                    });
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                <Upload className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleVariantImageChange(e, idx)}
                                className="hidden"
                                id={`variant-image-${idx}`}
                              />
                              <label
                                htmlFor={`variant-image-${idx}`}
                                className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                {variant.image ? 'Change Image' : 'Upload Image'}
                              </label>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Upload an image specific to this variant</p>
                        </div>

                        {/* Dynamic Attributes */}
                        {variantAttributes.length > 0 && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Attributes</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {variantAttributes.map((attr) => {
                                const availableValues = attributeValues[attr] || [];
                                
                                return (
                                  <div key={attr}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{attr}</label>
                                    {availableValues.length > 0 ? (
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
                                    ) : (
                                      <input 
                                        type="text" 
                                        value={variant.attributes?.[attr] || ''} 
                                        onChange={e => updateVariantAttribute(idx, attr, e.target.value)} 
                                        className="input-field w-full" 
                                        placeholder={`Enter ${attr} (no values configured)`}
                                      />
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

              {/* Frequently Bought Together */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Frequently Bought Together</h2>
                  <button
                    type="button"
                    onClick={() => setShowManualProductModal(true)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Manual Product</span>
                  </button>
                </div>
                
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

              {/* Manual Product Add Modal */}
              {showManualProductModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Add Manual Product</h2>
                      <button
                        type="button"
                        onClick={() => {
                          setShowManualProductModal(false);
                          setManualProduct({
                            productName: '',
                            price: '',
                            discountPrice: '',
                            image: null,
                            imagePreview: ''
                          });
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Product Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          name="productName"
                          value={manualProduct.productName}
                          onChange={handleManualProductChange}
                          className="input-field w-full"
                          placeholder="e.g., Samsung Ultra-Thin Clear Case"
                          required
                        />
                      </div>

                      {/* Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price (₹) *
                        </label>
                        <input
                          type="number"
                          name="price"
                          value={manualProduct.price}
                          onChange={handleManualProductChange}
                          className="input-field w-full"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>

                      {/* Discount Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Discount Price (₹) <span className="text-gray-400">(Optional)</span>
                        </label>
                        <input
                          type="number"
                          name="discountPrice"
                          value={manualProduct.discountPrice}
                          onChange={handleManualProductChange}
                          className="input-field w-full"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Image <span className="text-gray-400">(Optional)</span>
                        </label>
                        <div className="space-y-2">
                          {manualProduct.imagePreview ? (
                            <div className="relative w-full h-48 border border-gray-300 rounded-lg overflow-hidden">
                              <img
                                src={manualProduct.imagePreview}
                                alt="Preview"
                                className="w-full h-full object-contain"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setManualProduct(prev => ({
                                    ...prev,
                                    image: null,
                                    imagePreview: ''
                                  }));
                                }}
                                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600 mb-2">
                                Click to upload or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, GIF up to 10MB
                              </p>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleManualProductImageChange}
                            className="hidden"
                            id="manual-product-image"
                          />
                          <label
                            htmlFor="manual-product-image"
                            className="btn-secondary inline-block cursor-pointer text-center w-full"
                          >
                            {manualProduct.imagePreview ? 'Change Image' : 'Choose Image'}
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Modal Buttons */}
                    <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t">
                      <button
                        type="button"
                        onClick={() => {
                          setShowManualProductModal(false);
                          setManualProduct({
                            productName: '',
                            price: '',
                            discountPrice: '',
                            image: null,
                            imagePreview: ''
                          });
                        }}
                        className="btn-secondary px-4 py-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={addManualProduct}
                        className="btn-primary px-4 py-2"
                      >
                        Add Product
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
            {/* Buttons at the bottom of the form */}
          </div>
          <div className="flex justify-end gap-4 mt-8">
            <button type="submit" disabled={loading} className="btn-primary py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creating Product...' : 'Add Product'}
            </button>
            <Link href="/products" className="btn-secondary py-3 px-6 text-center block">Cancel</Link>
          </div>
        </form>
        )}

        {/* Bulk Import Section */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="card">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Bulk Import Instructions</h2>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Download the template file to see the required format</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Required fields: productName, price, category</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Optional fields: productTitle, productDescription, subcategory, sku, unit, discountPrice, stock, images, isActive, splineModelUrl, variants, keyFeatures, whatsInBox, specifications, shipmentLength, shipmentWidth, shipmentHeight, shipmentWeight, frequentlyBoughtTogether</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>For variants, use JSON format in the variants column</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Supported file formats: CSV, XLSX, XLS (max 10MB)</p>
                </div>
                
                {/* Dynamic Categories */}
                {bulkCategories && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Available Categories:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Categories:</h5>
                        {bulkCategories.categories && bulkCategories.categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {bulkCategories.categories.map((cat: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {cat}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No categories available</p>
                        )}
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Subcategories:</h5>
                        {bulkCategories.subcategories && bulkCategories.subcategories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {bulkCategories.subcategories.map((sub: any, index: number) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                {sub.name} ({sub.category})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No subcategories available</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {!bulkCategories && !bulkLoadingCategories && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-900">Categories Not Available</span>
                    </div>
                    <p className="text-sm text-red-700 mt-2">
                      Unable to load categories for bulk import. Please ensure categories are set up in the system.
                    </p>
                    <button
                      onClick={fetchBulkImportData}
                      className="mt-2 btn-secondary text-sm"
                    >
                      Retry Loading Categories
                    </button>
                  </div>
                )}
                
                {bulkLoadingCategories && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-blue-700">Loading available categories...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* File Upload */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Upload File</h2>
                <button
                  onClick={downloadBulkTemplate}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template</span>
                </button>
              </div>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  bulkDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                }`}
                onDragEnter={handleBulkDrag}
                onDragLeave={handleBulkDrag}
                onDragOver={handleBulkDrag}
                onDrop={handleBulkDrop}
              >
                <input
                  ref={bulkFileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && handleBulkFileSelect(e.target.files[0])}
                  className="hidden"
                />

                {!bulkFile ? (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-gray-600 mb-4">
                      Supports CSV, XLSX, and XLS files up to 10MB
                    </p>
                    <button
                      onClick={() => bulkFileInputRef.current?.click()}
                      className="btn-primary"
                    >
                      Choose File
                    </button>
                  </div>
                ) : (
                  <div>
                    <FileText className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      File Selected: {bulkFile.name}
                    </p>
                    <p className="text-gray-600 mb-4">
                      Size: {(bulkFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={handleBulkUpload}
                        disabled={bulkUploading}
                        className="btn-primary flex items-center space-x-2"
                      >
                        {bulkUploading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>{bulkUploading ? 'Uploading...' : 'Upload & Import'}</span>
                      </button>
                      <button
                        onClick={resetBulkForm}
                        className="btn-secondary"
                      >
                        Remove File
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Import Results */}
            {bulkImportResult && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Results</h2>
                
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{bulkImportResult.total}</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Successful</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{bulkImportResult.successful}</p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-900">Failed</span>
                    </div>
                    <p className="text-2xl font-bold text-red-900">{bulkImportResult.failed}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Success Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {bulkImportResult.total > 0 ? Math.round((bulkImportResult.successful / bulkImportResult.total) * 100) : 0}%
                    </p>
                  </div>
                </div>

                {/* Error Details */}
                {bulkImportResult.errors && bulkImportResult.errors.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Error Details</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {bulkImportResult.errors.map((error: any, index: number) => (
                        <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                          <div className="flex items-center space-x-2 mb-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-red-900">Row {error.row}</span>
                          </div>
                          <div className="space-y-1">
                            {error.errors.map((err: string, errIndex: number) => (
                              <p key={errIndex} className="text-sm text-red-700">• {err}</p>
                            ))}
                          </div>
                          <details className="mt-2">
                            <summary className="text-sm text-red-600 cursor-pointer">View Data</summary>
                            <pre className="text-xs text-red-700 mt-2 bg-red-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(error.data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sample Data */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Sample Data Format</h2>
              
              {bulkLoadingCategories ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading sample data...</span>
                  </div>
                </div>
              ) : bulkSampleData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">productName</th>
                        <th className="text-left py-2 px-2">category</th>
                        <th className="text-left py-2 px-2">subcategory</th>
                        <th className="text-left py-2 px-2">price</th>
                        <th className="text-left py-2 px-2">stock</th>
                        <th className="text-left py-2 px-2">sku</th>
                        <th className="text-left py-2 px-2">splineModelUrl</th>
                        <th className="text-left py-2 px-2">shipmentLength</th>
                        <th className="text-left py-2 px-2">shipmentWidth</th>
                        <th className="text-left py-2 px-2">shipmentHeight</th>
                        <th className="text-left py-2 px-2">shipmentWeight</th>
                        <th className="text-left py-2 px-2">shipmentWeightUnit (kg/gm)</th>
                        <th className="text-left py-2 px-2">youtubeVideoUrls (comma-separated)</th>
                        <th className="text-left py-2 px-2">productVideos (comma-separated URLs)</th>
                        <th className="text-left py-2 px-2">frequentlyBoughtTogether</th>
                        <th className="text-left py-2 px-2">variants</th>
                        <th className="text-left py-2 px-2">specifications</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkSampleData.map((sample, index) => (
                        <tr key={index} className={index < bulkSampleData.length - 1 ? 'border-b' : ''}>
                          <td className="py-2 px-2">{sample.productName}</td>
                          <td className="py-2 px-2">{sample.category}</td>
                          <td className="py-2 px-2">{sample.subcategory}</td>
                          <td className="py-2 px-2">{sample.price}</td>
                          <td className="py-2 px-2">{sample.stock}</td>
                          <td className="py-2 px-2">{sample.sku}</td>
                          <td className="py-2 px-2 text-xs">{sample.splineModelUrl || '-'}</td>
                          <td className="py-2 px-2">{sample.shipmentLength || '-'}</td>
                          <td className="py-2 px-2">{sample.shipmentWidth || '-'}</td>
                          <td className="py-2 px-2">{sample.shipmentHeight || '-'}</td>
                          <td className="py-2 px-2">{sample.shipmentWeight || '-'}</td>
                          <td className="py-2 px-2">{sample.shipmentWeightUnit || 'kg'}</td>
                          <td className="py-2 px-2 text-xs">{sample.youtubeVideoUrls || '-'}</td>
                          <td className="py-2 px-2 text-xs">{sample.productVideos || '-'}</td>
                          <td className="py-2 px-2 text-xs">{sample.frequentlyBoughtTogether || '-'}</td>
                          <td className="py-2 px-2 text-xs">
                            {sample.variants}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No sample data available. Please ensure categories are set up first.</p>
                </div>
              )}
              
              {/* Additional Format Information */}
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Format Guidelines:</h4>
                <div className="space-y-2 text-sm text-yellow-800">
                  <div className="flex items-start space-x-2">
                    <span className="font-medium">• Price:</span>
                    <span>Numeric value (e.g., 999.99)</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-medium">• Stock:</span>
                    <span>Integer value (e.g., 50)</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-medium">• isActive:</span>
                    <span>true/false or 1/0</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-medium">• Variants:</span>
                    <span>JSON array string with variantName (full name), attributes (size, color, etc.), stock, price, discountPrice, sku. Example: {`[{"variantName":"Product Name (128GB) Red","attributes":{"size":"128GB","color":"Red"},"stock":25,"price":"999.99","discountPrice":"899.99","sku":"SKU-RED"}]`}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-medium">• Images:</span>
                    <span>Comma-separated URLs (e.g., image1.jpg,image2.jpg)</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-medium">• Specifications:</span>
                    <span>Key:Value pairs separated by commas (e.g., Color:Red,Size:Large,Weight:500g)</span>
                  </div>
                </div>
              </div>

              {/* SKU Generation Info */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">SKU Generation Rules:</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-start space-x-2">
                    <span className="font-medium">• Format:</span>
                    <span className="font-mono">CAT-TIMESTAMP-RANDOM</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-medium">• CAT:</span>
                    <span>First 3 letters of category (e.g., ELEC for Electronics)</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-medium">• TIMESTAMP:</span>
                    <span>Last 6 digits of current timestamp</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-medium">• RANDOM:</span>
                    <span>3 random alphanumeric characters</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-medium">• Example:</span>
                    <span className="font-mono">ELEC-123456-ABC</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-medium">• Auto-generation:</span>
                    <span>SKUs are automatically generated if not provided</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons at the bottom of bulk import section */}
            <div className="flex justify-end gap-4 mt-8">
              <button 
                onClick={handleBulkUpload}
                disabled={bulkUploading || !bulkFile}
                className="btn-primary py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkUploading ? 'Uploading...' : 'Add Product'}
              </button>
              <Link href="/products" className="btn-secondary py-3 px-6 text-center block">Cancel</Link>
            </div>
          </div>
        )}

        {/* Bulk Export Section */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Bulk Export Products</h2>
              
              {/* Product Count Stats */}
              {loadingCount ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : productCount ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Total Products</p>
                        <p className="text-3xl font-bold text-blue-900 mt-2">{productCount.total || 0}</p>
                      </div>
                      <Package className="w-10 h-10 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Active Products</p>
                        <p className="text-3xl font-bold text-green-900 mt-2">{productCount.active || 0}</p>
                      </div>
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Inactive Products</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{productCount.inactive || 0}</p>
                      </div>
                      <XCircle className="w-10 h-10 text-gray-500" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Failed to load product count</p>
                  <button
                    onClick={fetchProductCount}
                    className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Export Button */}
              <div className="flex items-center justify-center">
                <button
                  onClick={handleExportProducts}
                  disabled={exporting || !productCount || productCount.total === 0}
                  className="btn-primary py-3 px-8 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Export Products ({productCount?.total || 0} products)</span>
                    </>
                  )}
                </button>
              </div>

              {productCount && productCount.total === 0 && (
                <div className="mt-4 text-center">
                  <p className="text-gray-500 text-sm">No products available to export</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}