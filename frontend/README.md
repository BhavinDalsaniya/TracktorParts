# Tractor Parts Frontend

Mobile-first Next.js 14 e-commerce website for tractor parts in Gujarat, India.

## Features

- **Mobile-First Design**: Optimized for 360px screens (low-end Android phones)
- **Gujarati Language**: Default language with English fallback
- **Large Touch Targets**: 44px minimum touch-friendly buttons
- **Fast Loading**: Lazy loading, WebP images, minimal animations
- **Offline-Ready**: LocalStorage for cart and auth
- **Simple Checkout**: COD-only with address selection

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- Axios (API Client)
- Lucide React (Icons)

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (shop)/            # Shop pages group
│   │   ├── auth/              # Authentication pages
│   │   ├── admin/             # Admin dashboard
│   │   ├── cart/              # Cart page
│   │   ├── checkout/          # Checkout flow
│   │   ├── orders/            # Order pages
│   │   ├── products/          # Product pages
│   │   ├── categories/        # Category pages
│   │   ├── search/            # Search page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── layout/            # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── MobileContainer.tsx
│   │   ├── Banner.tsx         # Banner component
│   │   ├── CategoryGrid.tsx   # Category grid
│   │   ├── ProductGrid.tsx    # Product grid
│   │   ├── ProductImageGallery.tsx
│   │   ├── CartItem.tsx       # Cart item
│   │   ├── AddToCartButton.tsx
│   │   ├── FilterBar.tsx      # Product filters
│   │   └── SearchBar.tsx      # Search input
│   ├── config/                # Configuration
│   │   └── constants.ts       # App constants (Gujarati translations)
│   ├── lib/                   # Utilities
│   │   ├── api.ts             # API client
│   │   └── utils.ts           # Helper functions
│   ├── store/                 # Zustand stores
│   │   ├── authStore.ts       # Auth state
│   │   ├── cartStore.ts       # Cart state
│   │   └── index.ts
│   └── types/                 # TypeScript types
│       └── index.ts
├── public/                    # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.local
```

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=ટ્રેક્ટર પાર્ટ્સ
NEXT_PUBLIC_RAZORPAY_KEY_ID=  # Optional
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm start
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Homepage | `/` | Categories + Featured Products |
| Products | `/products` | Product listing with filters |
| Product Detail | `/products/[slug]` | Single product with add to cart |
| Categories | `/categories` | Category grid |
| Category Page | `/categories/[slug]` | Products by category |
| Search | `/search?q=query` | Search results |
| Cart | `/cart` | Shopping cart |
| Checkout | `/checkout` | Address + COD checkout |
| Orders | `/orders` | Order history |
| Order Detail | `/orders/[id]` | Single order details |
| Login | `/auth/login` | OTP-based login |
| Admin Dashboard | `/admin` | Admin panel |
| Admin Products | `/admin/products` | Product management |
| Admin Orders | `/admin/orders` | Order management |

## Key Components

### Layout Components

- **Header**: Sticky header with back button, search, cart
- **BottomNav**: Fixed bottom navigation for mobile
- **MobileContainer**: Wrapper with proper padding

### Product Components

- **ProductGrid**: 2-column grid with lazy loading
- **ProductImageGallery**: Swipeable images
- **AddToCartButton**: Quantity selector + add button
- **FilterBar**: Brand filter + sort dropdown

### Cart Components

- **CartItem**: Quantity controls + remove button
- Cart persists in LocalStorage

## State Management

### Auth Store (Zustand)

```typescript
const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
```

### Cart Store (Zustand)

```typescript
const { items, subtotal, addItem, removeItem } = useCartStore();
```

## API Integration

All API calls use the centralized API client with automatic token handling:

```typescript
import { api } from '@/lib/api';

// GET request
const data = await api.get('/api/products');

// POST request
const response = await api.post('/api/orders', { addressId });
```

## Gujarati Translations

Translations are in `src/config/constants.ts`:

```typescript
import { gu } from '@/config/constants';

<h1>{gu.home}</h1>
<button>{gu.addToCart}</button>
```

## Design System

### Colors

- Primary: Green (`#22c55e`) - Trust, growth
- Accent: Orange (`#f97316`) - Discounts, CTAs
- Background: Light gray (`#f9fafb`)

### Typography

- Base: 18px on desktop, 16px on mobile (360px)
- Headings: 20px - 28px
- Body: 16px - 18px

### Touch Targets

- Buttons: 52px minimum height
- Icons: 44px minimum
- Inputs: 48px height

### Spacing

- Container padding: 16px
- Gap between items: 12px
- Section margins: 24px

## Performance Optimizations

1. **Image Optimization**: WebP format, lazy loading
2. **Code Splitting**: Automatic with Next.js
3. **Bundle Size**: Minimal dependencies
4. **Caching**: Aggressive image caching (1 year)
5. **Debouncing**: Search input debounced at 500ms

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Android Browser (Chrome-based)
- Supports iOS 12+

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL |
| `NEXT_PUBLIC_APP_NAME` | No | App name (default: ટ્રેક્ટર પાર્ટ્સ) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | No | Razorpay key for online payments |

## License

Copyright © 2024 Tractor Parts. All rights reserved.
