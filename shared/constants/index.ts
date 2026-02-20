/**
 * Shared constants between frontend and backend
 */

// App constants
export const APP_NAME = 'ટ્રેક્ટર પાર્ટ્સ';
export const APP_NAME_EN = 'Tractor Parts';

// Pagination
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 100;

// Languages
export const SUPPORTED_LANGUAGES = ['GUJARATI', 'ENGLISH', 'HINDI'] as const;
export const DEFAULT_LANGUAGE = 'GUJARATI';

// Indian states
export const INDIAN_STATES = [
  'Gujarat', 'Maharashtra', 'Rajasthan', 'Madhya Pradesh',
  'Uttar Pradesh', 'Delhi', 'Haryana', 'Punjab',
  'Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana',
  'Kerala', 'West Bengal', 'Bihar', 'Odisha',
] as const;

// Gujarat districts
export const GUJARAT_DISTRICTS = [
  'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot',
  'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar',
  'Surendranagar', 'Bharuch', 'Anand', 'Kheda',
  'Patan', 'Mehsana', 'Sabarkantha', 'Banaskantha',
  'Aravalli', 'Mahisagar', 'Chhota Udepur', 'Dahod',
  'Panchmahal', 'Valsad', 'Navsari', 'Dang',
  'Tapi', 'Narmada', 'Dwarka', 'Gir Somnath',
  'Botad', 'Morbi', 'Devbhoomi Dwarka', 'Kutch',
] as const;

// Order statuses
export const ORDER_STATUSES = {
  PENDING: { label: 'બાકી', labelEn: 'Pending', color: 'yellow' },
  CONFIRMED: { label: 'પુષ્ટિ', labelEn: 'Confirmed', color: 'blue' },
  PROCESSING: { label: 'પ્રક્રિયા', labelEn: 'Processing', color: 'purple' },
  SHIPPED: { label: 'મોકલવામાં આવ્યું', labelEn: 'Shipped', color: 'indigo' },
  DELIVERED: { label: 'પહોંચાડેલ', labelEn: 'Delivered', color: 'green' },
  CANCELLED: { label: 'રદ કરેલ', labelEn: 'Cancelled', color: 'red' },
  REFUNDED: { label: 'પરત આપેલ', labelEn: 'Refunded', color: 'gray' },
} as const;

// Payment methods
export const PAYMENT_METHODS = {
  COD: { label: 'કેશ ઓન ડિલિવરી', labelEn: 'Cash on Delivery' },
  ONLINE: { label: 'ઓનલાઇન ચુકવણી', labelEn: 'Online Payment' },
  UPI: { label: 'UPI ચુકવણી', labelEn: 'UPI Payment' },
} as const;

// Error messages (Gujarati)
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'તમે પ્રમાણીકૃત નથી',
  FORBIDDEN: 'તમને ઍક્સેસ કરવાની મંજૂરી નથી',
  NOT_FOUND: 'સંસાધન મળ્યું નથી',
  SERVER_ERROR: 'સર્વર ભૂલ. કૃપા કરીને ફરી પ્રયત્ન કરો',
  NETWORK_ERROR: 'નેટવર્ક ભૂલ. કૃપા કરીને તમારું ઇન્ટરનેટ જોડાણ તપાસો',
  INVALID_INPUT: 'અમાન્ય ઇનપુટ',
  OUT_OF_STOCK: 'સ્ટોકમાં ઉપલબ્ધ નથી',
} as const;

// Success messages (Gujarati)
export const SUCCESS_MESSAGES = {
  LOGIN: 'સફળતાપૂર્વક લોગિન થયું',
  LOGOUT: 'સફળતાપૂર્વક લોગઆઉટ થયું',
  REGISTER: 'ખાતું સફળતાપૂર્વક બનાવવામાં આવ્યું',
  CART_ADDED: 'કાર્ટમાં ઉમેરવામાં આવ્યું',
  CART_UPDATED: 'કાર્ટ અપડેટ થયું',
  CART_REMOVED: 'કાર્ટમાંથી દૂર કરવામાં આવ્યું',
  ORDER_PLACED: 'ઓર્ડર સફળતાપૂર્વક મૂકવામાં આવ્યું',
  PROFILE_UPDATED: 'પ્રોફાઇલ અપડેટ થયું',
  PASSWORD_CHANGED: 'પાસવર્ડ બદલાયો',
} as const;
