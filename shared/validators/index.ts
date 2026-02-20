/**
 * Shared validation functions
 */

// Phone validation (Indian)
export function isValidPhone(phone: string): boolean {
  const indianPhoneRegex = /^[6-9]\d{9}$/;
  return indianPhoneRegex.test(phone.replace(/\s/g, ''));
}

// Pincode validation (Indian)
export function isValidPincode(pincode: string): boolean {
  const indianPincodeRegex = /^[1-9]\d{5}$/;
  return indianPincodeRegex.test(pincode);
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation (min 6 characters)
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

// Quantity validation (positive integer)
export function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0;
}

// Price validation (positive number)
export function isValidPrice(price: number): boolean {
  return typeof price === 'number' && price > 0 && Number.isFinite(price);
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// SKU validation (alphanumeric, hyphens, underscores)
export function isValidSku(sku: string): boolean {
  const skuRegex = /^[a-zA-Z0-9-_]+$/;
  return skuRegex.test(sku);
}

// Slug validation (lowercase alphanumeric and hyphens)
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug);
}

// Name validation (at least 2 characters)
export function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}

// Address validation
export function isValidAddress(address: string): boolean {
  return address.trim().length >= 10;
}

// Generate slug from text
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ા-૿]/g, '') // Remove Gujarati characters for English slug
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
