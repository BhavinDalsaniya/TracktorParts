/**
 * Application constants
 */

export const config = {
  api: {
    url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    timeout: 30000, // 30 seconds for slow networks
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'ટ્રેક્ટર પાર્ટ્સ',
    defaultLocale: 'gu',
    currency: 'INR',
  },
  payment: {
    razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  },
  shipping: {
    freeShippingMin: 999,
    standardCharge: 50,
  },
};

// Gujarati translations
export const gu = {
  // Common
  appName: 'ટ્રેક્ટર પાર્ટ્સ',
  loading: 'લોડ થઈ રહ્યું છે...',
  error: 'ભૂલ થઈ',
  success: 'સફળ',
  retry: 'ફરી પ્રયત્ન કરો',
  close: 'બંધ કરો',
  save: 'સાચવો',
  cancel: 'રદ કરો',
  confirm: 'પુષ્ટિ કરો',
  delete: 'કાઢી નાખો',
  edit: 'ફેરફાર કરો',
  search: 'શોધો',
  filter: 'ફિલ્ટર',
  sort: 'ગોઠવો',
  clear: 'સાફ કરો',
  apply: 'લાગુ કરો',
  viewAll: 'બધુ જુઓ',
  back: 'પાછા',

  // Navigation
  home: 'હોમ',
  categories: 'શ્રેણીઓ',
  products: 'ઉત્પાદનો',
  orders: 'ઓર્ડર',
  account: 'ખાતું',
  admin: 'એડમિન',

  // Auth
  login: 'લોગિન',
  logout: 'લોગઆઉટ',
  register: 'રજીસ્ટર',
  phone: 'મોબાઇલ નંબર',
  otp: 'OTP',
  sendOtp: 'OTP મોકલો',
  verifyOtp: 'OTP પુષ્ટિ કરો',
  invalidOtp: 'અમાન્ય OTP',
  otpSent: 'OTP મોકલાયેલ',
  otpResend: 'ફરી OTP મોકલો',

  // Product
  price: 'કિંમત',
  addToCart: 'કાર્ટમાં ઉમેરો',
  inStock: 'સ્ટોકમાં',
  outOfStock: 'સ્ટોકમાં નથી',
  description: 'વર્ણન',
  specifications: 'સ્પેસિફિકેશન',
  compatibility: 'સુસંગતતા',
  discount: 'ડિસ્કાઉન્ટ',
  off: 'ઓફ',

  // Cart
  cart: 'કાર્ટ',
  cartEmpty: 'તમારું કાર્ટ ખાલી છે',
  subtotal: 'પેટ્ટાનો સરવાળો',
  total: 'કુલ',
  shipping: 'શિપિંગ',
  freeShipping: 'ફ્રી શિપિંગ',
  checkout: 'ચેકઆઉટ',
  continueShopping: 'ખરીદી ચાલુ રાખો',
  remove: 'દૂર કરો',
  quantity: 'જથ્થો',

  // Order
  order: 'ઓર્ડર',
  myOrders: 'મારા ઓર્ડર',
  orderNumber: 'ઓર્ડર નંબર',
  orderDate: 'ઓર્ડર તારીખ',
  orderStatus: 'ઓર્ડર સ્થિતિ',
  pending: 'પેન્ડિંગ',
  confirmed: 'પુષ્ટિ',
  processing: 'પ્રક્રિયા',
  shipped: 'મોકલાયેલ',
  delivered: 'પહોંચાડેલ',
  cancelled: 'રદ કરેલ',
  trackOrder: 'ઓર્ડર ટ્રેક કરો',
  orderSuccess: 'ઓર્ડર સફળતાપૂર્વક મૂકવામાં આવ્યો!',
  orderFailed: 'ઓર્ડર નિષ્ફળ',
  estimatedDelivery: 'અંદાજિત ડિલિવરી',

  // Payment
  payment: 'ચુકવણી',
  paymentMethod: 'ચુકવણી પદ્ધતિ',
  cod: 'કેશ ઓન ડિલિવરી',
  onlinePayment: 'ઓનલાઇન ચુકવણી',
  pay: 'ચુકવો',
  payNow: 'હવે ચુકવો',

  // Address
  address: 'સરનામું',
  addAddress: 'સરનામું ઉમેરો',
  editAddress: 'સરનામું ફેરફાર',
  shippingAddress: 'શિપિંગ સરનામું',
  fullName: 'પૂરું નામ',
  pincode: 'પિનકોડ',
  city: 'શહેર',
  district: 'જિલ્લો',
  state: 'રાજ્ય',

  // Tractor Brands
  mahindra: 'મહેન્દ્રા',
  swaraj: 'સ્વરાજ',
  escort: 'એસ્કોર્ટ',
  tafe: 'ટાફે',
  sonalika: 'સોનાલિકા',
  johnDeere: 'જ્હોન ડીયર',
  newHolland: 'ન્યૂ હોલેન્ડ',
  force: 'ફોર્સ',

  // Categories
  engine: 'એન્જિન',
  transmission: 'ટ્રાન્સમિશન',
  brakes: 'બ્રેક',
  electrical: 'ઇલેક્ટ્રિકલ',
  hydraulics: 'હાઇડ્રોલિક્સ',
  filters: 'ફિલ્ટર્સ',
  body: 'બોડી પાર્ટ્સ',
} as const;

// Order status with Gujarati labels
export const ORDER_STATUS = {
  pending: { label: 'પેન્ડિંગ', labelEn: 'Pending', color: 'bg-yellow-500' },
  confirmed: { label: 'પુષ્ટિ', labelEn: 'Confirmed', color: 'bg-blue-500' },
  processing: { label: 'પ્રક્રિયા', labelEn: 'Processing', color: 'bg-purple-500' },
  shipped: { label: 'મોકલાયેલ', labelEn: 'Shipped', color: 'bg-indigo-500' },
  delivered: { label: 'પહોંચાડેલ', labelEn: 'Delivered', color: 'bg-green-500' },
  cancelled: { label: 'રદ કરેલ', labelEn: 'Cancelled', color: 'bg-red-500' },
  refunded: { label: 'પરત આપેલ', labelEn: 'Refunded', color: 'bg-gray-500' },
} as const;

// Payment methods with Gujarati labels
export const PAYMENT_METHODS = {
  cod: { label: 'કેશ ઓન ડિલિવરી', labelEn: 'Cash on Delivery', icon: 'Banknote' },
  online: { label: 'ઓનલાઇન ચુકવણી', labelEn: 'Online Payment', icon: 'CreditCard' },
  upi: { label: 'UPI ચુકવણી', labelEn: 'UPI Payment', icon: 'Smartphone' },
} as const;

// Tractor brands
export const TRACTOR_BRANDS = [
  { id: 'mahindra', name: gu.mahindra, nameEn: 'Mahindra' },
  { id: 'swaraj', name: gu.swaraj, nameEn: 'Swaraj' },
  { id: 'escort', name: gu.escort, nameEn: 'Escort' },
  { id: 'tafe', name: gu.tafe, nameEn: 'TAFE' },
  { id: 'sonalika', name: gu.sonalika, nameEn: 'Sonalika' },
  { id: 'john-deere', name: gu.johnDeere, nameEn: 'John Deere' },
  { id: 'new-holland', name: gu.newHolland, nameEn: 'New Holland' },
  { id: 'force', name: gu.force, nameEn: 'Force' },
] as const;

// Category icons
export const CATEGORY_ICONS = {
  'engine': 'Wrench',
  'transmission': 'Cog',
  'brakes': 'Circle',
  'electrical': 'Zap',
  'hydraulics': 'Droplet',
  'filters': 'Filter',
  'body': 'Car',
} as const;
