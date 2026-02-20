# Product API Documentation

Mobile-optimized REST APIs for tractor parts e-commerce.

## Base URL
```
http://localhost:5000/api/products
```

## Response Format
All responses follow this structure:
```json
{
  "success": true,
  "message": "સફળતાપૂર્વક",  // Optional success message in Gujarati
  "data": { ... }
}
```

## Mobile Optimization Features

1. **Lightweight Responses** - Only essential fields sent
2. **Pagination** - Mandatory on all list endpoints (max 50 items)
3. **WebP Images** - Auto-compressed for faster loading
4. **Gujarati Search** - Full-text search in both languages
5. **Efficient Queries** - Optimized database queries

---

## Public Endpoints

### 1. List Products (Paginated + Filters)

```http
GET /api/products?page=1&limit=12&categoryId={id}&minPrice=100&maxPrice=5000&inStock=true&sortBy=price&sortOrder=asc
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 12 | Items per page (max 50) |
| `categoryId` | string | - | Filter by category |
| `search` | string | - | Search term |
| `tractorModelId` | string | - | Filter by compatible tractor |
| `sortBy` | string | createdAt | name, price, stock, soldCount |
| `sortOrder` | string | desc | asc, desc |
| `minPrice` | number | - | Minimum price |
| `maxPrice` | number | - | Maximum price |
| `inStock` | boolean | - | Only in-stock items |
| `isFeatured` | boolean | - | Only featured items |

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "clxxx...",
        "name": "Piston Kit - Mahindra 575",
        "nameGu": "પિસ્ટન કિટ - મહિન્દ્રા 575",
        "slug": "piston-kit-mahindra-575",
        "price": 4500,
        "compareAtPrice": 5000,
        "thumbnail": "/uploads/products/xxx/img.webp",
        "stock": 25,
        "averageRating": 4.5,
        "reviewCount": 12,
        "isFeatured": true,
        "isNew": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 45,
      "totalPages": 4,
      "hasMore": true
    }
  }
}
```

---

### 2. Search Products (Gujarati + English)

```http
GET /api/products/search?q=પિસ્ટન&page=1&limit=12
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": { ... },
    "query": "પિસ્ટન"
  }
}
```

---

### 3. Featured Products (Home Page)

```http
GET /api/products/featured?limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "...", "name": "...", "price": 4500, ... }
  ]
}
```

---

### 4. Products by Tractor Model

```http
GET /api/products/compatible/mahindra-575?page=1&limit=12
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "model": { "slug": "mahindra-575" },
    "pagination": { ... }
  }
}
```

---

### 5. Product Details

```http
GET /api/products/piston-kit-mahindra-575
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "sku": "PK-MH-575-001",
    "name": "Piston Kit - Mahindra 575",
    "nameGu": "પિસ્ટન કિટ - મહિન્દ્રા 575",
    "slug": "piston-kit-mahindra-575",
    "shortDescription": "High quality piston kit",
    "shortDescriptionGu": "ઉચ્ચ ગુણવત્તાનું પિસ્ટન કિટ",
    "description": "...",
    "descriptionGu": "...",
    "price": 4500,
    "compareAtPrice": 5000,
    "stock": 25,
    "images": [
      "/uploads/products/xxx/img_0.webp",
      "/uploads/products/xxx/img_1.webp"
    ],
    "thumbnail": "/uploads/products/xxx/img_0.webp",
    "category": {
      "id": "clxxx...",
      "name": "Engine Parts",
      "nameGu": "એન્જિન પાર્ટ્સ",
      "slug": "engine-parts"
    },
    "tags": ["mahindra", "575", "piston"],
    "specifications": {
      "bore": "95mm",
      "stroke": "110mm"
    },
    "specificationsGu": {
      "બોર": "95mm",
      "સ્ટ્રોક": "110mm"
    },
    "weight": 2000,
    "isReturnable": true,
    "warrantyDays": 30,
    "averageRating": 4.5,
    "reviewCount": 12,
    "compatibility": [
      {
        "id": "...",
        "notes": "Fits Mahindra 575 DI",
        "notesGu": "મહિન્દ્રા 575 DI માટે",
        "isConfirmed": true,
        "model": {
          "id": "...",
          "name": "Mahindra 575",
          "nameGu": "મહિન્દ્રા 575",
          "slug": "mahindra-575",
          "brand": {
            "id": "...",
            "name": "Mahindra",
            "nameGu": "મહિન્દ્રા",
            "slug": "mahindra"
          }
        }
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 6. Related Products

```http
GET /api/products/:id/related?limit=6
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "...", "name": "...", "price": 3500, ... }
  ]
}
```

---

## Admin Endpoints

All admin endpoints require `Authorization: Bearer <admin_token>`

### 7. Create Product

```http
POST /api/products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Piston Kit - Mahindra 575",
  "nameGu": "પિસ્ટન કિટ - મહિન્દ્રા 575",
  "slug": "piston-kit-mahindra-575",
  "shortDescription": "High quality piston kit",
  "shortDescriptionGu": "ઉચ્ચ ગુણવત્તાનું પિસ્ટન કિટ",
  "description": "Full product description...",
  "descriptionGu": "પૂર્ણ પ્રોડક્ટ વર્ણન...",
  "price": 4500,
  "compareAtPrice": 5000,
  "sku": "PK-MH-575-001",
  "stock": 25,
  "categoryId": "clxxx...",
  "tags": ["mahindra", "575", "piston"],
  "specifications": { "bore": "95mm" },
  "specificationsGu": { "બોર": "95mm" },
  "weight": 2000,
  "isActive": true,
  "isFeatured": false
}
```

---

### 8. Update Product

```http
PUT /api/products/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "price": 4800,
  "stock": 30,
  "isActive": true
}
```

---

### 9. Update Inventory

```http
PATCH /api/products/:id/stock
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "stock": 50,
  "type": "ADD",  // ADD, REMOVE, SET
  "notes": "Stock received"
}
```

**Types:**
- `ADD` - Add to current stock
- `REMOVE` - Remove from current stock
- `SET` - Set exact stock value

---

### 10. Toggle Active Status

```http
PATCH /api/products/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "isActive": false
}
```

---

### 11. Upload Images (Auto-Compressed)

```http
POST /api/products/:id/images
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

images: [file1, file2, ...]  // Max 5 images, max 5MB each
```

**Image Processing:**
- Auto-compressed to WebP format
- Max width: 800px
- Quality: 75%
- Thumbnails generated automatically

**Response:**
```json
{
  "success": true,
  "message": "છબીઓ અપલોડ થઈ ગઈ",
  "data": {
    "images": [
      "/uploads/products/xxx/img_123_0.webp",
      "/uploads/products/xxx/img_123_1.webp"
    ],
    "thumbnail": "/uploads/products/xxx/img_123_0.webp",
    "addedCount": 2
  }
}
```

---

### 12. Delete Image

```http
DELETE /api/products/:id/images/:imageId
Authorization: Bearer <admin_token>
```

---

### 13. Delete Product (Soft Delete)

```http
DELETE /api/products/:id
Authorization: Bearer <admin_token>
```

---

## Error Responses

```json
{
  "success": false,
  "error": "પ્રોડક્ટ મળ્યું નથી"  // Gujarati error message
}
```

| HTTP Code | Error Message (Gujarati) |
|-----------|--------------------------|
| 400 | ખોટી વિનંતી |
| 404 | પ્રોડક્ટ મળ્યું નથી |
| 429 | ખૂબ વધારે વિનંતીઓ |
| 500 | સર્વર ભૂલ |

---

## Image Optimization Strategy

| Step | Action |
|------|--------|
| 1 | Receive original image (max 5MB) |
| 2 | Resize to max 800px width/height |
| 3 | Convert to WebP format |
| 4 | Compress at 75% quality |
| 5 | Generate thumbnail (300px) |
| 6 | Store in `/uploads/products/:id/` |
| 7 | Return CDN-ready URL |

**Typical Compression Results:**
- JPEG 2MB → WebP 150KB (~92% reduction)
- PNG 3MB → WebP 200KB (~93% reduction)

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| All product endpoints | 100 req | 15 minutes |

---

## Files Created

| File | Purpose |
|------|---------|
| [backend/src/routes/products.ts](backend/src/routes/products.ts) | Product routes |
| [backend/src/controllers/product.ts](backend/src/controllers/product.ts) | Business logic |
| [backend/src/services/imageUpload.ts](backend/src/services/imageUpload.ts) | Image compression |
| [backend/src/validators/product.ts](backend/src/validators/product.ts) | Validation schemas |
