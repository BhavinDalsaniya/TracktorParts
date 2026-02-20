# Payment API Documentation

Optional online payment integration with Razorpay, with COD as fallback.

## Overview

The payment system is designed to work with or without Razorpay credentials:
- **Without credentials**: Only COD (Cash on Delivery) is available
- **With credentials**: Full Razorpay integration + COD fallback

## Configuration

Add to [backend/.env](backend/.env.example):

```bash
# Payment Gateway (Optional)
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
```

If these are not set, the system automatically falls back to COD-only mode.

---

## API Endpoints

### Get Available Payment Methods

```http
GET /api/payment/methods
Authorization: Bearer <token>
```

**Response (with Razorpay configured):**
```json
{
  "success": true,
  "data": {
    "methods": ["cod", "upi", "card", "netbanking", "wallet", "emi"],
    "razorpayKeyId": "rzp_test_..."
  }
}
```

**Response (COD only):**
```json
{
  "success": true,
  "data": {
    "methods": ["cod"],
    "razorpayKeyId": null
  }
}
```

---

### Create Payment Order

```http
POST /api/payment/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 9000,
  "currency": "INR"
}
```

**Response (success):**
```json
{
  "success": true,
  "data": {
    "razorpayOrder": {
      "id": "order_...",
      "amount": 900000,
      "currency": "INR",
      "receipt": "ORD-2024-000001"
    },
    "amountInPaisa": 900000,
    "keyId": "rzp_test_..."
  }
}
```

**Response (Razorpay not configured):**
```json
{
  "success": true,
  "data": {
    "razorpayOrder": null,
    "amountInPaisa": 900000,
    "keyId": null
  }
}
```

---

### Verify Payment (Webhook)

```http
POST /api/payment/verify
Content-Type: application/json

{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "ચુકવણી પૂર્ણ થઈ ગઈ"
}
```

**Response (failed):**
```json
{
  "success": false,
  "message": "ચુકવણી પુષ્ટિ થઈ શક્ય નથી"
}
```

---

### Handle Payment Failure

```http
POST /api/payment/failed
Content-Type: application/json

{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "ચુકવણી નિષ્ફળ. સ્ટોક પાછું સુધારાયું"
}
```

---

### COD Checkout (Always Available)

```http
POST /api/payment/checkout/cod
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "clxxx...",
  "addressId": "clxxx...",
  "couponCode": "FARMER500"
}
```

**Response:**
```json
{
  "success": true,
  "message": "ઓર્ડર સફળતાપૂર્વક મૂકવામાં આવ્યો!",
  "data": {
    "order": {
      "id": "clxxx...",
      "orderNumber": "ORD-2024-000001",
      "total": 10120,
      "paymentMethod": "COD",
      "status": "PENDING"
    }
  }
}
```

---

### Process Refund (Admin)

```http
POST /api/payment/admin/refund
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "paymentId": "pay_...",
  "amount": 9000,
  "reason": "Product damaged"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "પરત આપવાની પ્રક્રિયા શરૂ કરી"
}
```

**Response (failed):**
```json
{
  "success": false,
  "message": "પરત આપવાની પ્રક્રિયા નિષ્ફળ"
}
```

---

## Frontend Integration

### 1. Load Razorpay SDK

```tsx
// frontend/components/PaymentForm.tsx
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentForm({ amount, orderId }: Props) {
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  useEffect(() => {
    // Fetch available payment methods
    fetch('/api/payment/methods', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPaymentMethods(data.data.methods));

    // Load Razorpay SDK if online payment available
    if (paymentMethods.includes('upi')) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // ...
}
```

### 2. Create Order & Open Checkout

```tsx
async function handleOnlinePayment() {
  // Step 1: Create Razorpay order
  const orderRes = await fetch('/api/payment/create-order', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount })
  });

  const { data } = await orderRes.json();

  if (!data.razorpayOrder) {
    alert('Online payment not available');
    return;
  }

  // Step 2: Open Razorpay checkout
  const options = {
    key: data.keyId,
    amount: data.amountInPaisa,
    currency: 'INR',
    name: 'ટ્રેક્ટર પાર્ટ્સ',
    description: 'Order Payment',
    order_id: data.razorpayOrder.id,
    handler: function (response: any) {
      // Payment successful, verify on backend
      verifyPayment(response);
    },
    prefill: {
      name: user.name,
      contact: user.phone,
      email: user.email
    },
    theme: {
      color: '#22c55e'
    },
    // Redirect to verify endpoint
    redirect: true,
    redirect_url: `${window.location.origin}/api/payment/verify`
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}
```

### 3. Verify Payment

```tsx
async function verifyPayment(response: any) {
  const res = await fetch('/api/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature
    })
  });

  const data = await res.json();

  if (data.success) {
    router.push(`/orders/${orderId}`);
  } else {
    alert('Payment verification failed');
  }
}
```

### 4. COD Checkout (Simpler)

```tsx
async function handleCodCheckout() {
  const res = await fetch('/api/payment/checkout/cod', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      orderId,
      addressId,
      couponCode
    })
  });

  const data = await res.json();

  if (data.success) {
    router.push(`/orders/${data.data.order.id}`);
  }
}
```

---

## Payment Flow Diagram

```
┌─────────────────┐
│  User Checkout  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Select Payment Method   │
│ - COD (always available)│
│ - Online (if configured)│
└──────┬──────────────┬────┘
       │              │
   COD │              │ Online
       │              ▼
       │    ┌──────────────────┐
       │    │ Create Order     │
       │    │ POST /create-order│
       │    └────────┬─────────┘
       │             │
       │             ▼
       │    ┌──────────────────┐
       │    │ Razorpay Checkout│
       │    │ (User pays)      │
       │    └────────┬─────────┘
       │             │
       │             ▼
       │    ┌──────────────────┐
       │    │ Verify Payment   │
       │    │ POST /verify     │
       │    └────────┬─────────┘
       │             │
       └─────────────┴──────────┐
                             │
                             ▼
                   ┌──────────────────┐
                   │ Order Confirmed  │
                   │ Status: CONFIRMED│
                   └──────────────────┘
```

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| Signature Verification | HMAC SHA256 using key secret |
| Amount Verification | Server-side order creation |
| Webhook Security | Only Razorpay can call verify endpoint |
| Fallback | Graceful degradation to COD if API fails |
| Inventory Safety | Stock restored on payment failure |

---

## Files Created

| File | Purpose |
|------|---------|
| [backend/src/services/razorpay.ts](backend/src/services/razorpay.ts) | Razorpay service class |
| [backend/src/routes/payment.ts](backend/src/routes/payment.ts) | Payment routes |
| [backend/src/services/invoice.ts](backend/src/services/invoice.ts) | GST invoice generation |

---

## Error Handling

The system handles these scenarios gracefully:

1. **Razorpay Not Configured**: Returns null for razorpayOrder, allows COD
2. **API Failure**: Logs error, falls back to COD
3. **Invalid Signature**: Rejects payment, alerts user
4. **Payment Failed**: Restores inventory, notifies user
5. **Network Issues**: Automatic retry in checkout SDK

---

## Testing

### Test Mode Credentials

Use Razorpay test mode for development:
- Key ID: `rzp_test_...`
- Key Secret: Available in Razorpay dashboard

### Test Cards

| Card Number | Expiry | CVV | Result |
|-------------|--------|-----|--------|
| 4242 4242 4242 4242 | Any future date | Any 3 digits | Success |
| 4000 0000 0000 0002 | Any future date | Any 3 digits | Failure |

### COD Testing

Simply remove RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from .env to test COD-only mode.
