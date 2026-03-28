'use client';

import React, { useState } from 'react';
import { Search, ExternalLink, TrendingUp, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { getApiUrl, getAuthHeaders, formatCurrency } from '@/lib/config';
import toast from 'react-hot-toast';
import { Skeleton } from './Skeleton';

interface PriceScraperProps {
  productName: string;
  productTitle?: string;
  onPriceSelect: (price: number) => void;
}

interface ScrapedPrice {
  price: number;
  title: string;
  url: string;
  source: string;
  seller: string;
  asin?: string;
  fsn?: string;
}

interface ScrapingResult {
  success: boolean;
  data?: {
    // For EAN-based scraping
    eanCode?: string;
    productDetails?: {
      totalListings?: number;
      amazonListings?: number;
      flipkartListings?: number;
    };
    allListings?: ScrapedPrice[];
    amazonListings?: ScrapedPrice[];
    flipkartListings?: ScrapedPrice[];
    priceAnalysis?: {
      lowest?: number;
      average?: number;
      median?: number;
    };
    allPrices?: number[];
    
    // For product info-based scraping
    amazonResult?: ScrapedPrice;
    flipkartResult?: ScrapedPrice;
    suggestedPricing?: {
      amazonPrice?: number;
      flipkartPrice?: number;
      suggestedPrice?: number;
    };
  };
  message?: string;
}

export default function PriceScraper({ productName, productTitle, onPriceSelect }: PriceScraperProps) {
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingResult, setScrapingResult] = useState<ScrapingResult | null>(null);
  const [eanCode, setEanCode] = useState('');
  const [modelNumber, setModelNumber] = useState('');

  const handleScrapePrices = async () => {
    if (!productName.trim()) {
      toast.error('Product name is required for price scraping');
      return;
    }

    setIsScraping(true);
    setScrapingResult(null);

    try {
      // Use the correct endpoint based on available data
      let endpoint = '/admin/products/get-prices-by-product-info';
      let requestBody: any = {
        productName: productName,
        productTitle: productTitle || productName,
        modelNumber: modelNumber || undefined
      };

      // If EAN code is provided, use EAN-based scraping
      if (eanCode && eanCode.trim()) {
        endpoint = '/admin/products/scrape-prices-by-ean';
        requestBody = {
          eanCode: eanCode.trim()
        };
      }

      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody)
      });

      const result: ScrapingResult = await response.json();

      if (result.success) {
        setScrapingResult(result);
        toast.success('Price scraping completed successfully!');
      } else {
        toast.error(result.message || 'Failed to scrape prices');
      }
    } catch (error) {
      toast.error('Failed to scrape prices. Please try again.');
    } finally {
      setIsScraping(false);
    }
  };

  const handlePriceSelect = (price: number) => {
    onPriceSelect(price);
    toast.success(`Price set to ₹${price.toLocaleString()}`);
  };


  const getProfitMarginColor = (margin: number) => {
    if (margin < 10) return 'text-red-600';
    if (margin < 20) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center space-x-2">
              <span>EAN Code</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Optional</span>
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={eanCode}
              onChange={(e) => setEanCode(e.target.value)}
              placeholder="Enter 13-digit EAN code"
              className="input-field w-full pr-10"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-500">?</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">For precise product matching</p>
        </div>
        
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center space-x-2">
              <span>Model Number</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Optional</span>
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
              placeholder="e.g., iPhone 15 Pro Max"
              className="input-field w-full pr-10"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-500">?</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">For better search accuracy</p>
        </div>
      </div>

      {/* Professional Scrape Button */}
      <div className="relative">
        <button
          onClick={handleScrapePrices}
          disabled={isScraping || !productName.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isScraping ? (
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing Market Data...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-3">
              <Search className="w-5 h-5" />
              <span>Analyze Market Prices</span>
            </div>
          )}
        </button>
      </div>

      {/* Enhanced Loading State */}
      {isScraping && (
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-3 bg-blue-50 border border-blue-200 rounded-full px-6 py-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-800 font-medium">Analyzing market data from multiple sources...</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amazon Loading */}
            <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div>
                  <Skeleton className="h-5 bg-blue-200 rounded w-24 mb-1" />
                  <Skeleton className="h-3 bg-blue-200 rounded w-32" />
                </div>
              </div>
              <Skeleton className="h-8 bg-blue-200 rounded w-28 mb-3" />
              <Skeleton className="h-4 bg-blue-200 rounded w-full mb-2" />
              <Skeleton className="h-4 bg-blue-200 rounded w-3/4" />
            </div>
            
            {/* Flipkart Loading */}
            <div className="border-2 border-dashed border-yellow-200 rounded-xl p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <div>
                  <Skeleton className="h-5 bg-yellow-200 rounded w-24 mb-1" />
                  <Skeleton className="h-3 bg-yellow-200 rounded w-32" />
                </div>
              </div>
              <Skeleton className="h-8 bg-yellow-200 rounded w-28 mb-3" />
              <Skeleton className="h-4 bg-yellow-200 rounded w-full mb-2" />
              <Skeleton className="h-4 bg-yellow-200 rounded w-3/4" />
            </div>
          </div>
          
          {/* Analysis Loading */}
          <div className="border-2 border-dashed border-green-200 rounded-xl p-6 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <Skeleton className="h-5 bg-green-200 rounded w-32 mb-1" />
                <Skeleton className="h-3 bg-green-200 rounded w-40" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-12 bg-green-200 rounded w-full" />
              <Skeleton className="h-12 bg-green-200 rounded w-full" />
              <Skeleton className="h-12 bg-green-200 rounded w-full" />
            </div>
          </div>
        </div>
      )}

      {scrapingResult && scrapingResult.success && scrapingResult.data && (
        <div className="space-y-6">
          {/* Market Intelligence Results Header */}
          <div className="text-center py-4">
            <div className="inline-flex items-center space-x-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-green-800 font-medium text-sm">Market Analysis Complete</span>
            </div>
          </div>

          {/* Market Prices - Enhanced Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amazon Price */}
            {(scrapingResult.data?.amazonResult || (scrapingResult.data?.amazonListings && scrapingResult.data.amazonListings.length > 0)) && (
              <div className="border-2 border-blue-200 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">A</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 text-lg">Amazon</h4>
                      <p className="text-sm text-blue-700">Prime Verified</p>
                    </div>
                  </div>
                  {scrapingResult.data?.amazonResult?.url && (
                    <a
                      href={scrapingResult.data.amazonResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                      title="View on Amazon"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>
                <div className="mb-4">
                  <p className="text-3xl font-bold text-blue-900 mb-2">
                    {formatCurrency(
                      scrapingResult.data?.amazonResult?.price || 
                      (scrapingResult.data?.amazonListings && scrapingResult.data.amazonListings[0]?.price) || 0
                    )}
                  </p>
                  <p className="text-sm text-blue-700 line-clamp-2">
                    {scrapingResult.data?.amazonResult?.title || 
                     (scrapingResult.data?.amazonListings && scrapingResult.data.amazonListings[0]?.title) || 'Amazon Product'}
                  </p>
                </div>
                <button
                  onClick={() => handlePriceSelect(
                    scrapingResult.data?.amazonResult?.price || 
                    (scrapingResult.data?.amazonListings && scrapingResult.data.amazonListings[0]?.price) || 0
                  )}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Use Amazon Price
                </button>
              </div>
            )}

            {/* Flipkart Price */}
            {(scrapingResult.data?.flipkartResult || (scrapingResult.data?.flipkartListings && scrapingResult.data.flipkartListings.length > 0)) && (
              <div className="border-2 border-yellow-200 rounded-xl p-6 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">F</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-900 text-lg">Flipkart</h4>
                      <p className="text-sm text-yellow-700">Plus Verified</p>
                    </div>
                  </div>
                  {scrapingResult.data.flipkartResult?.url && (
                    <a
                      href={scrapingResult.data.flipkartResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-lg transition-colors"
                      title="View on Flipkart"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>
                <div className="mb-4">
                  <p className="text-3xl font-bold text-yellow-900 mb-2">
                    {formatCurrency(
                      scrapingResult.data?.flipkartResult?.price || 
                      (scrapingResult.data?.flipkartListings && scrapingResult.data.flipkartListings[0]?.price) || 0
                    )}
                  </p>
                  <p className="text-sm text-yellow-700 line-clamp-2">
                    {scrapingResult.data?.flipkartResult?.title || 
                     (scrapingResult.data?.flipkartListings && scrapingResult.data.flipkartListings[0]?.title) || 'Flipkart Product'}
                  </p>
                </div>
                <button
                  onClick={() => handlePriceSelect(
                    scrapingResult.data?.flipkartResult?.price || 
                    (scrapingResult.data?.flipkartListings && scrapingResult.data.flipkartListings[0]?.price) || 0
                  )}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Use Flipkart Price
                </button>
              </div>
            )}
          </div>

          {/* Suggested Pricing - Enhanced */}
          {(scrapingResult.data?.suggestedPricing?.suggestedPrice || scrapingResult.data?.priceAnalysis?.lowest) && (
            <div className="border-2 border-green-200 rounded-xl p-6 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900 text-lg">AI Suggested Price</h4>
                    <p className="text-sm text-green-700">Optimized for maximum competitiveness</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">RECOMMENDED</span>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-4xl font-bold text-green-900 mb-2">
                  {formatCurrency(
                    scrapingResult.data?.suggestedPricing?.suggestedPrice || 
                    scrapingResult.data?.priceAnalysis?.lowest || 0
                  )}
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-green-700">Based on market analysis</span>
                  <span className="text-green-600">•</span>
                  <span className="text-green-700">Competitive advantage</span>
                </div>
              </div>
              <button
                onClick={() => handlePriceSelect(
                  scrapingResult.data?.suggestedPricing?.suggestedPrice || 
                  scrapingResult.data?.priceAnalysis?.lowest || 0
                )}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                Apply Suggested Price
              </button>
            </div>
          )}

          {/* Price Analysis - Enhanced */}
          {scrapingResult.data?.priceAnalysis && (
            <div className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-slate-50 shadow-lg">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">Market Price Analysis</h4>
                  <p className="text-sm text-gray-600">Comprehensive pricing insights</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-red-600 font-bold text-lg">↓</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Lowest Price</p>
                  <p className="text-xl font-bold text-gray-900">
                    {scrapingResult.data?.priceAnalysis?.lowest ? formatCurrency(scrapingResult.data.priceAnalysis.lowest) : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold text-lg">≈</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Average Price</p>
                  <p className="text-xl font-bold text-gray-900">
                    {scrapingResult.data?.priceAnalysis?.average ? formatCurrency(scrapingResult.data.priceAnalysis.average) : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold text-lg">↔</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Median Price</p>
                  <p className="text-xl font-bold text-gray-900">
                    {scrapingResult.data?.priceAnalysis?.median ? formatCurrency(scrapingResult.data.priceAnalysis.median) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Product Details */}
          {scrapingResult.data?.productDetails && (
            <div className="border rounded-lg p-4 bg-purple-50">
              <h4 className="font-medium text-purple-900 mb-2">Product Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-purple-700">Total Listings: {scrapingResult.data.productDetails.totalListings}</p>
                  <p className="text-purple-700">Amazon Listings: {scrapingResult.data.productDetails.amazonListings}</p>
                  <p className="text-purple-700">Flipkart Listings: {scrapingResult.data.productDetails.flipkartListings}</p>
                </div>
                {scrapingResult.data.eanCode && (
                  <div>
                    <p className="text-purple-700">EAN Code: {scrapingResult.data.eanCode}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {scrapingResult && !scrapingResult.success && (
        <div className="border rounded-lg p-4 bg-red-50">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-red-900">Scraping Failed</h4>
          </div>
          <p className="text-sm text-red-700">
            {scrapingResult.message || 'Unable to fetch market prices. Please try again.'}
          </p>
        </div>
      )}

      {/* Enhanced Help Text */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <div>
            <h5 className="text-sm font-medium text-blue-900 mb-1">Market Intelligence Tips</h5>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• <strong>EAN Code:</strong> Enter 13-digit EAN for precise product matching</li>
              <li>• <strong>Model Number:</strong> Include specific model for better accuracy</li>
              <li>• <strong>Real-time Data:</strong> Prices are fetched live from Amazon & Flipkart</li>
              <li>• <strong>AI Analysis:</strong> Get intelligent pricing recommendations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
