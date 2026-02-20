# Cart & Order API Documentation

Simple, mobile-first cart and checkout system optimized for farmers in Gujarat.

## Cart API

### Get Cart
```http
GET /api/cart
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "items": [
      {
        "id": "...",
        "quantity": 2,
        "unitPrice": 4500,
        "total": 9000,
        "product": {
          "id": "...",
          "name": "Piston Kit",
          "nameGu": "પિસ્ટન કિટ",
          "slug": "piston-kit",
          "price": 4500,
          "thumbnail": "/uploads/.../img.webp",
          "stock": 25
        }
      }
    ],
    "subtotal": 9000,
    "discount": 0,
    "total": 9000,
    "itemCount": 2
  }
}
```

### Add to Cart
```http
POST /api/cart
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "clxxx...",
  "quantity": 2
}

Response:
{
  "success": true,
  "message": "કાર્ટમાં ઉમેરવામાં આવ્યું"
}
```

### Update Cart Item
```http
PATCH /api/cart/items/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

### Remove from Cart
```http
DELETE /api/cart/items/:id
Authorization: Bearer <token>
```

### Clear Cart
```http
DELETE /api/cart
Authorization: Bearer <token>
```

### Apply Coupon
```http
POST /api/cart/coupon
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "FARMER500"
}

Response:
{
  "success": true,
  "message": "કૂપન લાગુ કરવામાં આવ્યું",
  "data": {
    "code": "FARMER500",
    "discount": 500,
    "total": 8500
  }
}
```

### Remove Coupon
```http
DELETE /api/cart/coupon
Authorization: Bearer <token>
```

### Cart Summary (for Checkout)
```http
GET /api/cart/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isEmpty": false,
    "itemCount": 2,
    "items": [...],
    "subtotal": 9000,
    "discount": 500,
    "shipping": 0,
    "total": 8500,
    "freeShipping": true,
    "freeShippingRemaining": 0
  }
}
```

---

## Order API

### Get User Orders
```http
GET /api/orders?page=1&limit=10&status=DELIVERED
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "...",
        "orderNumber": "ORD-2024-000001",
        "total": 9000,
        "status": "DELIVERED",
        "paymentStatus": "PAID",
        "createdAt": "2024-01-15T10:30:00Z",
        "items": [
          {
            "productName": "Piston Kit",
            "image": "/uploads/.../img.webp",
            "quantity": 2
          }
        ]
      }
    ],
    "pagination": { ... }
  }
}
```

### Get Checkout Summary
```http
GET /api/orders/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "subtotal": 9000,
    "discount": 500,
    "shipping": 0,
    "tax": 1620,
    "total": 10120,
    "addresses": [
      {
        "id": "clxxx...",
        "label": "Home",
        "fullName": "Rajeshbhai",
        "phone": "9876543210",
        "city": "Ahmedabad",
        "district": "Ahmedabad",
        "state": "Gujarat",
        "pincode": "380001",
        "isDefault": true
      }
    ],
    "freeShipping": true
  }
}
```

### Create Order (Simple Checkout)
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "addressId": "clxxx...",
  "paymentMethod": "COD",
  "notes": "Morning delivery please"
}

Response:
{
  "success": true,
  "message": "ઓર્ડર સફળતાપૂર્વક મૂકવામાં આવ્યો!",
  "data": {
    "id": "clxxx...",
    "orderNumber": "ORD-2024-000001",
    "total": 10120,
    "paymentMethod": "COD",
    "estimatedDelivery": "5-7 દિવસ"
  }
}
```

### Order Details
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "orderNumber": "ORD-2024-000001",
    "items": [...],
    "subtotal": 9000,
    "shipping": 0,
    "tax": 1620,
    "total": 10620,
    "status": "CONFIRMED",
    "trackingNumber": "TRK123456",
    "courierName": "Delhivery",
    "shippingAddress": { ... },
    "timeline": [
      { "status": "PENDING", "label": "પેન્ડિંગ", "completed": true },
      { "status": "CONFIRMED", "label": "પુષ્ટિ", "completed": true },
      { "status": "PROCESSING", "label": "પ્રક્રિયા", "completed": false },
      { "status": "SHIPPED", "label": "મોકલાયેલ", "completed": false },
      { "status": "DELIVERED", "label": "પહોંચાડેલ", "completed": false }
    ]
  }
}
```

### Track Order
```http
GET /api/orders/:id/track
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "પુષ્ટિ",
    "titleEn": "Confirmed",
    "message": "ઓર્ડર પુષ્ટિ થયો. જલ્દી જ મોકલવાશે",
    "messageEn": "Order confirmed. Will be shipped soon",
    "icon": "check",
    "orderNumber": "ORD-2024-000001",
    "status": "CONFIRMED",
    "trackingNumber": "TRK123456",
    "courierName": "Delhivery",
    "estimatedDelivery": "2024-01-20",
    "shippingAddress": { ... },
    "itemCount": 2
  }
}
```

### Cancel Order
```http
POST /api/orders/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "જરૂર નથી"
}

Response:
{
  "success": true,
  "message": "ઓર્ડર રદ કરવામાં આવ્યો"
}
```

### Get GST Invoice
```http
GET /api/orders/:id/invoice
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invoiceNumber": "INV-ORD-2024-000001",
    "invoiceDate": "2024-01-15T10:30:00Z",
    "seller": {
      "name": "ટ્રેક્ટર પાર્ટ્સ",
      "address": "ગુજરાત, ભારત",
      "phone": "9876543210",
      "email": "support@tractorparts.com",
      "gstin": "24ABCDE1234F1Z5"
    },
    "buyer": { ... },
    "items": [...],
    "summary": {
      "subtotal": 9000,
      "shipping": 0,
      "tax": 1620,
      "discount": 500,
      "total": 10120,
      "totalInWords": "દસ હજાર એકસો વીસી રૂપિયા"
    },
    "gstSummary": {
      "cgst": 810,
      "sgst": 810,
      "igst": 0
    }
  }
}
```

---

## Admin Order Endpoints

### List All Orders (Admin)
```http
GET /api/orders/admin/all?page=1&limit=20&status=PENDING&search=rajesh
Authorization: Bearer <admin_token>
```

### Update Order Status (Admin)
```http
PATCH /api/orders/admin/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "CONFIRMED",
  "trackingNumber": "TRK123456",
  "courierName": "Delhivery",
  "estimatedDelivery": "2024-01-20",
  "adminNotes": "Customer called for urgent delivery"
}
```

### Order Statistics (Admin)
```http
GET /api/orders/admin/stats?days=30
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 156,
    "pendingOrders": 12,
    "shippedOrders": 45,
    "deliveredOrders": 89,
    "cancelledOrders": 10,
    "totalRevenue": 567890,
    "period": "Last 30 days"
  }
}
```

---

## Order Status Flow

| Status | Gujarati | English | Description |
|--------|----------|---------|-------------|
| PENDING | પેન્ડિંગ | Pending | Order placed, awaiting confirmation |
| CONFIRMED | પુષ્ટિ | Confirmed | Order confirmed by seller |
| PROCESSING | પ્રક્રિયા | Processing | Being packed |
| SHIPPED | મોકલાયેલ | Shipped | Handed over to courier |
| OUT_FOR_DELIVERY | પહોંચાડવા માટે | Out for Delivery | With delivery person |
| DELIVERED | પહોંચાડેલ | Delivered | Successfully delivered |
| CANCELLED | રદ કરેલ | Cancelled | Cancelled by customer/seller |
| REFUNDED | પરત આપેલ | Refunded | Payment refunded |

---

## Payment Methods

| Method | Description |
|--------|-------------|
| COD | Cash on Delivery (Default) |
| ONLINE | Razorpay/Online Payment (Optional) |
| UPI | UPI Payment (Optional) |

---

## Pricing & GST

| Component | Calculation |
|-----------|-------------|
| Subtotal | Sum of all items |
| Discount | Coupon discount |
| Shipping | ₹0 if order ≥ ₹999, else ₹50 |
| GST | 18% on subtotal |
| Total | Subtotal - Discount + Shipping + GST |

**Example:**
```
Subtotal: ₹9,000
Discount: ₹500 (Coupon)
Shipping: ₹0 (Free shipping)
GST (18%): ₹1,530
─────────────────────────
Total: ₹10,030
```

---

## Features

- **Simple Checkout**: Only address selection required
- **COD Default**: No payment gateway needed
- **Free Shipping**: Orders above ₹999
- **Inventory Management**: Stock deducted on order confirmation
- **GST Invoice**: Auto-generated with proper breakdown
- **Order Tracking**: Real-time status updates
- **Mobile Optimized**: Lightweight responses, Gujarati messages

---

## Files Created

| File | Purpose |
|------|---------|
| [backend/src/routes/cart.ts](backend/src/routes/cart.ts) | Cart routes |
| [backend/src/routes/orders.ts](backend/src/routes/orders.ts) | Order routes |
| [backend/src/controllers/cart.ts](backend/src/controllers/cart.ts) | Cart logic |
| [backend/src/controllers/order.ts](backend/src/controllers/order.ts) | Order logic |
| [backend/src/services/invoice.ts](backend/src/services/invoice.ts) | GST invoice generation |
