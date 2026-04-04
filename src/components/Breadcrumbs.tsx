'use client';

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm mb-4 md:mb-6 overflow-x-auto pb-2">
      <Link 
        href="/dashboard" 
        className="inline-flex items-center px-2 md:px-3 py-2 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 font-medium whitespace-nowrap flex-shrink-0"
      >
        <Home className="w-3 h-3 md:w-4 md:h-4 mr-1" />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />
          {item.href ? (
            <Link 
              href={item.href}
              className="px-2 md:px-3 py-2 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 font-medium whitespace-nowrap flex-shrink-0"
            >
              {item.label}
            </Link>
          ) : (
            <span className="px-2 md:px-3 py-2 text-gray-900 font-semibold bg-gray-100 rounded-lg whitespace-nowrap flex-shrink-0">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
