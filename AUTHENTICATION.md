# Authentication System - Mobile + OTP Based

Simple, mobile-friendly authentication designed for farmers in Gujarat.

## Overview

- **No passwords for users** - Only mobile number + OTP
- **Admin users** - Still use password for security
- **JWT tokens** - Access + refresh token pattern
- **Rate limiting** - Prevents OTP abuse
- **Gujarati language** - All messages in Gujarati

## User Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  User App   │────▶│  Send OTP    │────▶│   Server    │
└─────────────┘     └──────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │ SMS Gateway │
                    │ (or console)│
                    └─────────────┘

┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  User App   │────▶│  Verify OTP  │────▶│   Server    │
└─────────────┘     └──────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │ JWT Tokens  │
                    │ (Access +   │
                    │  Refresh)   │
                    └─────────────┘
```

## API Endpoints

### Public Endpoints

#### 1. Send OTP
```
POST /api/auth/send-otp
Content-Type: application/json

{
  "phone": "9876543210"
}

Response:
{
  "success": true,
  "message": "તમારા નંબર પર OTP મોકલવામાં આવ્યો છે.",
  "data": {
    "isNewUser": false,
    "phone": "9876543210",
    "expiresIn": 5
  }
}
```

**Rate Limit:** 3 requests per hour per phone number

#### 2. Verify OTP (Login/Register)
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456",
  "name": "Rajeshbhai"  // Required only for new users
}

Response:
{
  "success": true,
  "message": "સફળતાપૂર્વક લોગિન થયું!",
  "data": {
    "user": {
      "id": "clxxx...",
      "name": "Rajeshbhai",
      "phone": "9876543210",
      "role": "CUSTOMER",
      "language": "GUJARATI"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Refresh Token
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Admin Endpoints

#### 4. Admin Login (Password-based)
```
POST /api/auth/admin/login
Content-Type: application/json

{
  "phone": "9876543210",
  "password": "admin123"
}

Response:
{
  "success": true,
  "message": "સફળતાપૂર્વક લોગિન થયું",
  "data": {
    "user": {
      "id": "clxxx...",
      "name": "Admin",
      "phone": "9876543210",
      "role": "ADMIN"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Protected Endpoints (Require Token)

#### 5. Get Current User
```
GET /api/auth/me
Authorization: Bearer <access_token>

Response:
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "name": "Rajeshbhai",
    "phone": "9876543210",
    "email": null,
    "role": "CUSTOMER",
    "language": "GUJARATI",
    "avatar": null,
    "isVerified": true
  }
}
```

#### 6. Update Profile
```
PATCH /api/auth/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Rajeshbhai Patel",
  "email": "rajesh@example.com",
  "language": "GUJARATI"
}

Response:
{
  "success": true,
  "message": "પ્રોફાઇલ અપડેટ થયું",
  "data": { ... }
}
```

#### 7. Logout
```
POST /api/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "..."
}

Response:
{
  "success": true,
  "message": "સફળતાપૂર્વક લોગઆઉટ થયું"
}
```

### Admin-Only Endpoints

#### 8. List All Users
```
GET /api/auth/admin/users?page=1&limit=20&search=rajesh
Authorization: Bearer <admin_access_token>

Response:
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

#### 9. Activate/Deactivate User
```
PATCH /api/auth/admin/users/:id/status
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "isActive": false
}

Response:
{
  "success": true,
  "message": "વપરાશકર્તા નિષ્ક્રિય થયા",
  "data": { ... }
}
```

## Security Features

### Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| Send OTP | 3 requests | per hour per phone |
| Verify OTP | 10 requests | per 5 minutes per phone |
| General API | 100 requests | per 15 minutes |

### OTP Security
- **6-digit random OTP** (100000-999999)
- **5 minutes expiry**
- **Maximum 3 attempts** per OTP
- **Auto-cleanup** of expired OTPs

### JWT Security
- **Access Token**: 7 days expiry
- **Refresh Token**: 30 days expiry
- **Refresh tokens stored** in database for revocation
- **Token rotation** on refresh

## Development Testing

In development mode, OTP is logged to console:

```
🔓 OTP for 9876543210: 123456
```

Use this OTP to verify the authentication flow.

## Setup Instructions

### 1. Seed Database (Create Admin User)
```bash
cd backend
npm run prisma:seed
```

Default admin credentials:
- Phone: `9876543210`
- Password: `admin123`

### 2. Configure Environment (.env)
```env
# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# OTP (for SMS gateway integration)
SMS_API_KEY=your-sms-gateway-key
```

### 3. Start Development Server
```bash
npm run dev
```

## Frontend Integration

### React/Next.js Example

```typescript
// Send OTP
const sendOtp = async (phone: string) => {
  const response = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return response.json();
};

// Verify OTP & Login
const verifyOtp = async (phone: string, otp: string, name?: string) => {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp, name }),
  });
  const data = await response.json();

  // Store tokens
  if (data.success) {
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
  }

  return data;
};

// Get current user
const getCurrentUser = async () => {
  const token = localStorage.getItem('accessToken');
  const response = await fetch('/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
};
```

## Error Messages (Gujarati)

| Code | Message |
|------|---------|
| Invalid Phone | કૃપા કરીને માન્ય મોબાઇલ નંબર દાખલ કરો |
| Invalid OTP | અમાન્ય OTP. કૃપા કરીને ફરી પ્રયત્ન કરો. |
| Name Required | નામ આવશ્યક છે. કૃપા કરીને તમારું નામ દાખલ કરો. |
| Account Inactive | તમારું ખાતું નિષ્ક્રિય છે. સપોર્ટથી સંપર્ક કરો. |
| Too Many OTPs | ખૂબ વધારે OTP વિનંતીઓ. કૃપા કરીને 1 કલાક પછી ફરી પ્રયત્ન કરો. |
| Token Expired | ટોકનની સમયસીમા સમાપ્ત |
| Invalid Token | અમાન્ય ટોકન |

## Files Created

| File | Purpose |
|------|---------|
| `backend/src/routes/auth.ts` | Auth routes (OTP + admin) |
| `backend/src/services/otp.ts` | OTP generation & verification |
| `backend/src/services/sms.ts` | SMS service (development stub) |
| `backend/src/middleware/rateLimiter.ts` | Rate limiting middleware |
| `backend/src/middleware/auth.ts` | JWT authentication + role check |
| `backend/src/validators/auth.ts` | Zod validation schemas |
