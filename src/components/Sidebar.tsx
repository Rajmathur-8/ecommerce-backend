'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  CreditCard, 
  Image, 
  Tag,
  Truck,
  ChevronDown,
  Settings,
  Gift,
  Ticket,
  Shield,
  MessageSquare
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    title: 'Products',
    icon: Package,
    href: '/products',
    submenu: [
      { title: 'All Products', href: '/products' },
      { title: 'Stock Alerts', href: '/stock-alerts' },
      { title: 'Categories', href: '/products/categories' },
      { title: 'Sub Categories', href: '/products/subcategory' },
    ],
  },
  {
    title: 'Customers',
    icon: Users,
    href: '/customers',
  },
  {
    title: 'Orders',
    icon: ShoppingCart,
    href: '/orders/all-orders',
  },
  {
    title: 'Payments',
    icon: CreditCard,
    href: '/payments',
    submenu: [
      { title: 'Payment Integration', href: '/payments/integration' },
      { title: 'Transactions', href: '/payments/transactions' },
    ],
  },
  {
    title: 'Logistics',
    icon: Truck,
    href: '/logistics/deliveries',
    submenu: [
      { title: 'Deliveries', href: '/logistics/deliveries' },
      { title: 'Shipping Partner', href: '/logistics/order-mappings' },
    ],
  },
  {
    title: 'Banners',
    icon: Image,
    href: '/banners',
  },
  {
    title: 'Discounts',
    icon: Tag,
    href: '/discounts',
    submenu: [
      { title: 'Coupon Details', href: '/discounts' },
      { title: 'Coupon Management', href: '/discounts/management' },
    ],
  },
  {
    title: 'Rewards',
    icon: Gift,
    href: '/rewards',
  },
  {
    title: 'Promos',
    icon: Tag,
    href: '/promos',
    submenu: [
      { title: 'Promo Details', href: '/promos/details' },
      { title: 'Promo Management', href: '/promos/management' },
    ],
  },
  {
    title: 'Gift Vouchers',
    icon: Ticket,
    href: '/gift-vouchers',
    submenu: [
      { title: 'Gift Voucher Details', href: '/gift-vouchers/details' },
      { title: 'Gift Voucher Management', href: '/gift-vouchers/management' },
    ],
  },
  {
    title: 'Enquiries',
    icon: MessageSquare,
    href: '/enquiries',
    submenu: [
      { title: 'FAQ Management', href: '/enquiries/faq' },
      { title: 'Enquiry Management', href: '/enquiries' },
    ],
  },
  {
    title: 'Warranty',
    icon: Shield,
    href: '/warranty',
    submenu: [
      { title: 'Warranty Plans', href: '/warranty' },
      { title: 'Warranty Management', href: '/warranty/management' },
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/settings',
  },
];

export default function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isSubmenuActive = (submenu: any[]) => 
    submenu.some(item => pathname === item.href);



  // Auto-expand items with active submenu
  const shouldAutoExpand = (item: any) => {
    if (!item.submenu) return false;
    return isSubmenuActive(item.submenu);
  };

  // Initialize expanded items based on active path
  useEffect(() => {
    const itemsToExpand: string[] = [];
    menuItems.forEach((item) => {
      if (shouldAutoExpand(item)) {
        itemsToExpand.push(item.title);
      }
    });
    if (itemsToExpand.length > 0) {
      setExpandedItems(prev => {
        const newItems = [...prev];
        itemsToExpand.forEach(title => {
          if (!newItems.includes(title)) {
            newItems.push(title);
          }
        });
        return newItems;
      });
    }
  }, [pathname]);

  return (
    <div className="bg-white shadow-lg w-64 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Gupta Distributors</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isExpanded = expandedItems.includes(item.title) || shouldAutoExpand(item);
          const isItemActive = isActive(item.href) || isSubmenuActive(item.submenu || []);

          // Only render button+submenu for items with submenu, otherwise just render Link
          if (hasSubmenu) {
            return (
              <div key={item.title} className="mb-1">
                <button
                  onClick={() => toggleExpanded(item.title)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                    isItemActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 transition-colors ${
                      isItemActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'
                    }`} />
                    <span className="font-medium text-sm">{item.title}</span>
                  </div>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform duration-200 text-gray-400 ${
                      isExpanded ? 'rotate-180' : ''
                    } ${isItemActive ? 'text-primary-600' : ''}`} 
                  />
                </button>
                {/* Submenu */}
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-3 py-1">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`block px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                          isActive(subItem.href)
                            ? 'bg-primary-50 text-primary-700 font-medium border-l-2 border-primary-600 -ml-3 pl-4'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <div key={item.title} className="mb-1">
                <Link
                  href={item.href}
                  className={`block px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isItemActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 transition-colors ${
                      isItemActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'
                    }`} />
                    <span className="font-medium text-sm">{item.title}</span>
                  </div>
                </Link>
              </div>
            );
          }
        })}
      </nav>
    </div>
  );
} 