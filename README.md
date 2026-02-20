# ટ્રેક્ટર પાર્ટ્સ - Tractor Parts E-commerce

A mobile-first e-commerce website for selling tractor parts in Gujarat, India.

## Project Overview

This project is designed for farmers in Gujarat with:
- Mobile-first design (optimized for 360px width)
- Gujarati language as default
- Very lightweight performance for slow internet
- Support for low-end Android phones

## Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Forms**: React Hook Form

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Zod
- **Logging**: Winston

## Project Structure

```
tractor-spare-part/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/            # App router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities and API client
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript types
│   │   ├── contexts/       # React contexts
│   │   ├── config/         # App configuration
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.js
│
├── backend/                 # Express backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # App configuration
│   │   ├── validators/     # Zod schemas
│   │   └── types/          # TypeScript types
│   ├── prisma/             # Prisma files
│   │   └── schema.prisma   # Database schema
│   ├── logs/               # Log files
│   ├── uploads/            # Uploaded files
│   ├── package.json
│   └── tsconfig.json
│
└── shared/                  # Shared code
    ├── types/              # Shared TypeScript types
    ├── constants/          # Shared constants
    └── validators/         # Shared validators
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tractor-spare-part
```

### 2. Database Setup

#### Create PostgreSQL Database

```sql
CREATE DATABASE tractor_parts;
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your values
# DATABASE_URL="postgresql://postgres:password@localhost:5432/tractor_parts"
# JWT_SECRET=your-secret-key-here
```

#### Run Prisma Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database
npm run prisma:seed
```

#### Start Backend Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

Backend will run on `http://localhost:5000`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env if needed
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### Start Frontend Server

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Frontend will run on `http://localhost:3000`

## Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/tractor_parts"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env.local)

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_API_TIMEOUT=30000

# App
NEXT_PUBLIC_APP_NAME=ટ્રેક્ટર પાર્ટ્સ
NEXT_PUBLIC_DEFAULT_LOCALE=gu
NEXT_PUBLIC_SUPPORTED_LOCALES=gu,en,hi

# Features
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
NEXT_PUBLIC_ENABLE_IMAGE_LAZY_LOADING=true
```

## Database Schema

The application uses the following main models:

- **User**: User accounts with phone authentication
- **Address**: User delivery addresses
- **Category**: Product categories
- **Product**: Tractor parts with Gujarati translations
- **Cart**: Shopping cart
- **Order**: Customer orders
- **Session**: Refresh token storage

## Performance Optimizations

### Frontend
- Image optimization with WebP/AVIF formats
- Code splitting with Next.js App Router
- Lazy loading for images
- Compression enabled
- Static page generation where possible
- Minimal bundle size

### Backend
- Response compression
- Rate limiting
- Database connection pooling
- Efficient queries with Prisma
- Request/response logging
- Error handling middleware

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products` - List products (with pagination)
- `GET /api/products/:slug` - Get product by slug
- `GET /api/products/search` - Search products

### Categories
- `GET /api/categories` - List categories
- `GET /api/categories/:slug` - Get category by slug

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PATCH /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove cart item

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - List user's orders
- `GET /api/orders/:id` - Get order by ID

### Users
- `GET /api/users/me` - Get current user
- `PATCH /api/users/me` - Update profile
- `POST /api/users/change-password` - Change password

## Development Tips

### Running Both Services

Use separate terminal windows:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Viewing Database

```bash
cd backend
npm run prisma:studio
```

### Type Checking

```bash
# Backend
cd backend && npm run type-check

# Frontend
cd frontend && npm run type-check
```

## Deployment

### Backend Deployment

1. Set `NODE_ENV=production`
2. Update `DATABASE_URL` to production database
3. Set secure `JWT_SECRET`
4. Build: `npm run build`
5. Start: `npm start`

### Frontend Deployment

1. Update `NEXT_PUBLIC_API_URL` to production API
2. Build: `npm run build`
3. Deploy `.next` folder and `public` folder
4. Or use Vercel for automatic deployment

## License

MIT License

## Support

For support, email support@tractorparts.com
