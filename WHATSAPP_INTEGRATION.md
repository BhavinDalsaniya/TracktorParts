# WhatsApp Integration

Floating WhatsApp support button for customer assistance and manual orders.

## Features

- **Floating Button**: Always visible on all pages (except auth/admin)
- **Pre-filled Gujarati Messages**: Context-aware messages
- **Product Queries**: Ask about specific products
- **Manual Orders**: Place orders via WhatsApp
- **Mobile Optimized**: Large touch-friendly button

## Components

### 1. WhatsAppButton

Floating help button for general inquiries.

**Location**: [frontend/src/components/WhatsAppButton.tsx](frontend/src/components/WhatsAppButton.tsx)

```tsx
import { WhatsAppButton } from '@/components/WhatsAppButton';

<WhatsAppButton
  phoneNumber="919876543210"
  message="મને આ ટ્રેક્ટર પાર્ટ વિશે માહિતી જોઈએ છે"
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `phoneNumber` | string | `919876543210` | WhatsApp number (with country code, no +) |
| `message` | string | Default Gujarati message | Pre-filled message |
| `productInfo` | object | - | Product details for product-specific queries |

### 2. WhatsAppOrderButton

Button for placing orders via WhatsApp.

**Usage:**

```tsx
import { WhatsAppOrderButton } from '@/components/WhatsAppButton';

// Single product order
<WhatsAppOrderButton
  phoneNumber="919876543210"
  productInfo={{
    name: "પિસ્ટન કિટ",
    id: "prod_123",
    price: 4500
  }}
/>

// Cart order
<WhatsAppOrderButton
  phoneNumber="919876543210"
  cartItems={items}
/>
```

## Pre-filled Messages

### General Inquiry
```
મને આ ટ્રેક્ટર પાર્ટ વિશે માહિતી જોઈએ છે
```
("I need information about this tractor part")

### Product Inquiry
```
હેલો, મને પિસ્ટન કિટ (ID: prod_123) વિશે માહિતી જોઈએ છે. શું આ ઉપલબ્ધ છે?
```
("Hello, I need information about Piston Kit (ID: prod_123). Is this available?")

### Order Request
```
હેલો, હું નીચેના પાર્ટ્સ ઓર્ડર કરવા માંગુ છું:

• પિસ્ટન કિટ
  કિંમત: ₹4500
  જથ્થો: 1

કૃપા કરીને ઓર્ડર પુષ્ટિ કરો.

સરનામું અને ચુકવણી વિગતે જણાવો.
```

## Configuration

### Update Phone Number

Edit the default phone number in [frontend/src/components/WhatsAppButton.tsx](frontend/src/components/WhatsAppButton.tsx):

```tsx
// Default WhatsApp number (replace with actual)
const DEFAULT_PHONE_NUMBER = '919876543210';
```

Or pass as prop:

```tsx
<WhatsAppButton phoneNumber="919912345678" />
```

### Environment Variable (Optional)

Add to `.env.local`:

```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=919876543210
```

Then update component to use:

```tsx
const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210';
```

## Placement

### Global Floating Button

Added via [WhatsAppProvider](frontend/src/components/WhatsAppProvider.tsx) in root layout:

- **Visible**: All customer-facing pages
- **Hidden**: Auth pages (`/auth/*`), Admin pages (`/admin/*`)

### Product Page Button

Location: [Product detail page](frontend/src/app/products/[slug]/page.tsx)
- Below Add to Cart button
- Includes product name, ID, and price

### Cart Page Button

Location: [Cart page](frontend/src/app/cart/page.tsx)
- Below Checkout button
- Lists all cart items

## Styling

```css
/* Floating button styles */
.whatsapp-float {
  position: fixed;
  bottom: 96px;  /* Above bottom nav */
  right: 16px;
  z-index: 40;
  background: #22c55e; /* WhatsApp green */
  border-radius: 9999px;
  padding: 12px 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* Pulse animation for notification badge */
@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}
```

## Use Cases

1. **Product Inquiries**: Customer asks about specific part
2. **Stock Availability**: Check if part is in stock
3. **Bulk Orders**: Order multiple parts
4. **Payment Issues**: Discuss payment options
5. **Order Modifications**: Change existing order
6. **Technical Support**: Get help with product compatibility

## WhatsApp Business API (Optional)

For advanced features, integrate WhatsApp Business API:

1. **Get API Access**: [business.facebook.com](https://business.facebook.com)
2. **Set Up Webhook**: Receive messages in backend
3. **Auto-Replies**: Send automated responses
4. **Order Integration**: Create orders from WhatsApp messages

## Benefits for Farmers

- **No App Needed**: Works with WhatsApp already installed
- **Gujarati Support**: Native language communication
- **Visual**: Can send photos of parts for verification
- **Voice Messages**: Easier for those who prefer speaking
- **Offline Queue**: Message delivered when online
- **Trust**: Familiar interface

## Files Created

| File | Purpose |
|------|---------|
| [frontend/src/components/WhatsAppButton.tsx](frontend/src/components/WhatsAppButton.tsx) | Main WhatsApp components |
| [frontend/src/components/WhatsAppProvider.tsx](frontend/src/components/WhatsAppProvider.tsx) | Conditional rendering wrapper |

## Files Modified

| File | Changes |
|------|---------|
| [frontend/src/app/layout.tsx](frontend/src/app/layout.tsx) | Added WhatsAppProvider |
| [frontend/src/app/products/[slug]/page.tsx](frontend/src/app/products/[slug]/page.tsx) | Added WhatsApp order button |
| [frontend/src/app/cart/page.tsx](frontend/src/app/cart/page.tsx) | Added WhatsApp order button |
