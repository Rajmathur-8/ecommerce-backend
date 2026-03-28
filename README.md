# E-commerce Admin Dashboard

A modern admin dashboard for managing e-commerce operations built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Dashboard Overview** - Analytics and key metrics
- **Product Management** - Add, edit, delete products with categories
- **Banner Management** - Manage promotional banners
- **Order Management** - View and manage customer orders
- **Payment Integration** - Configure payment gateways
- **Customer Management** - View customer information
- **Authentication** - Secure admin login system

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# API Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:5000/api

# Environment
NODE_ENV=development
```

### 3. API Configuration

The app uses a centralized API configuration located in `src/lib/config.ts`:

```typescript
// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000/api',
  TIMEOUT: 10000, // 10 seconds
};

// Helper functions
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
```

### 4. Using Base URL in Components

Instead of hardcoding API URLs, use the helper functions:

```typescript
import { getApiUrl, getAuthHeaders } from '@/lib/config';

// Fetch data
const response = await fetch(getApiUrl('/banners'), {
  headers: getAuthHeaders()
});

// POST data
const response = await fetch(getApiUrl('/banners'), {
  method: 'POST',
  headers: getAuthHeaders(),
  body: JSON.stringify(data)
});
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the admin dashboard.

## API Endpoints

The admin dashboard communicates with the backend API using the following endpoints:

- **Authentication**: `/admin/login`
- **Banners**: `/banners`
- **Categories**: `/categories`
- **Products**: `/products`
- **Orders**: `/orders`
- **Payments**: `/payments/*`

## Development

### Project Structure
```
src/
├── app/                 # Next.js app directory
│   ├── banners/        # Banner management
│   ├── customers/      # Customer management
│   ├── dashboard/      # Dashboard overview
│   ├── login/          # Admin login
│   ├── orders/         # Order management
│   ├── payments/       # Payment integration
│   └── products/       # Product management
├── components/         # Reusable components
│   ├── DashboardLayout.tsx
│   └── Sidebar.tsx
└── lib/               # Utility functions
    └── config.ts      # API configuration
```

### Adding New API Calls

When adding new API calls, always use the base URL configuration:

1. Import the helper functions:
```typescript
import { getApiUrl, getAuthHeaders, getFormDataHeaders } from '@/lib/config';
```

2. Use the appropriate helper function:
```typescript
// For JSON data
const response = await fetch(getApiUrl('/endpoint'), {
  headers: getAuthHeaders(),
  body: JSON.stringify(data)
});

// For FormData
const response = await fetch(getApiUrl('/endpoint'), {
  headers: getFormDataHeaders(),
  body: formData
});
```

## Deployment

For production deployment, update the `NEXT_PUBLIC_BASE_URL` environment variable to point to your production API server.

```env
NEXT_PUBLIC_BASE_URL=https://your-api-domain.com/api
``` 