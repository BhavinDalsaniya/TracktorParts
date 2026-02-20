'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';
import { generateSlug } from '@/lib/utils';
import { ImageUpload } from '@/components/ImageUpload';

interface Category {
  id: string;
  name: string;
  nameGu: string;
  slug: string;
}

interface UploadedImage {
  url: string;
  file: File;
  preview: string;
  uploading?: boolean;
  error?: string;
}

interface FormData {
  name: string;
  nameGu: string;
  slug: string;
  description: string;
  descriptionGu: string;
  price: string;
  compareAtPrice: string;
  sku: string;
  stock: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  weight: string;
  tags: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, clearAuth } = useAuthStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<FormData>({
    name: '',
    nameGu: '',
    slug: '',
    description: '',
    descriptionGu: '',
    price: '',
    compareAtPrice: '',
    sku: '',
    stock: '0',
    categoryId: '',
    isActive: true,
    isFeatured: false,
    weight: '',
    tags: '',
  });

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }

    fetchCategories();
  }, [isAuthenticated, user, router, hasHydrated]);

  const fetchCategories = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Category[] }>('/api/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from English name
    if (field === 'name' && typeof value === 'string') {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.nameGu.trim()) newErrors.nameGu = 'Gujarati name is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.descriptionGu.trim()) newErrors.descriptionGu = 'Gujarati description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';

    // Check for at least one uploaded image
    const hasUploadedImages = uploadedImages.length > 0 && uploadedImages.some(img => img.url && !img.uploading && !img.error);
    if (!hasUploadedImages) newErrors.images = 'At least one image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check if any images are still uploading
    if (uploadedImages.some(img => img.uploading)) {
      setErrors({ general: 'Please wait for images to finish uploading' });
      return;
    }

    setSubmitting(true);

    try {
      // Get the uploaded image URLs
      const imageUrls = uploadedImages
        .filter(img => img.url && !img.error)
        .map(img => img.url);

      if (imageUrls.length === 0) {
        setErrors({ images: 'At least one valid image is required' });
        setSubmitting(false);
        return;
      }

      const payload = {
        name: formData.name,
        nameGu: formData.nameGu,
        slug: formData.slug,
        description: formData.description,
        descriptionGu: formData.descriptionGu,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
        sku: formData.sku,
        stock: parseInt(formData.stock) || 0,
        categoryId: formData.categoryId,
        images: imageUrls,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
      };

      await api.post('/api/products', payload);

      router.push('/admin/products');
    } catch (error: any) {
      console.error('Failed to create product:', error);
      if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: 'Failed to create product. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-primary-500 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/products')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">New Product</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                clearAuth();
                router.push('/admin/login');
              }}
              className="flex h-10 items-center gap-2 rounded-full bg-red-500 px-3 text-sm font-semibold text-white"
            >
              Logout
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || uploadedImages.some(img => img.uploading)}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-primary-600 font-semibold disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error */}
          {errors.general && (
            <div className="rounded-xl bg-red-50 p-4 text-red-600">
              {errors.general}
            </div>
          )}

          {/* Image Upload - Show first */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Product Images *</h2>
            <ImageUpload
              images={uploadedImages}
              onChange={setUploadedImages}
              maxImages={5}
            />
            {errors.images && <p className="mt-2 text-sm text-red-600">{errors.images}</p>}
          </div>

          {/* Basic Information */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h2>

            <div className="space-y-3">
              {/* English Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Product Name (English) *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Piston Kit"
                  className={'w-full rounded-xl border-2 bg-white py-3 px-4 ' + (errors.name ? 'border-red-300' : 'border-gray-200')}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Gujarati Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Product Name (Gujarati) *
                </label>
                <input
                  type="text"
                  value={formData.nameGu}
                  onChange={(e) => handleChange('nameGu', e.target.value)}
                  placeholder="e.g., પિસ્ટન કિટ"
                  className={'w-full rounded-xl border-2 bg-white py-3 px-4 ' + (errors.nameGu ? 'border-red-300' : 'border-gray-200')}
                />
                {errors.nameGu && <p className="mt-1 text-sm text-red-600">{errors.nameGu}</p>}
              </div>

              {/* Slug */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="e.g., piston-kit"
                  className={'w-full rounded-xl border-2 bg-white py-3 px-4 ' + (errors.slug ? 'border-red-300' : 'border-gray-200')}
                />
                {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
              </div>

              {/* SKU */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  SKU *
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  placeholder="e.g., PK-001"
                  className={'w-full rounded-xl border-2 bg-white py-3 px-4 ' + (errors.sku ? 'border-red-300' : 'border-gray-200')}
                />
                {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                  className={'w-full rounded-xl border-2 bg-white py-3 px-4 ' + (errors.categoryId ? 'border-red-300' : 'border-gray-200')}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.nameGu})
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Pricing & Stock</h2>

            <div className="space-y-3">
              {/* Price */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="e.g., 1500"
                  className={'w-full rounded-xl border-2 bg-white py-3 px-4 ' + (errors.price ? 'border-red-300' : 'border-gray-200')}
                />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>

              {/* Compare At Price */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Compare At Price (₹) (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.compareAtPrice}
                  onChange={(e) => handleChange('compareAtPrice', e.target.value)}
                  placeholder="e.g., 2000"
                  className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 px-4"
                />
              </div>

              {/* Stock */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleChange('stock', e.target.value)}
                  placeholder="e.g., 50"
                  className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 px-4"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Weight (kg) (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  placeholder="e.g., 2.5"
                  className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 px-4"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>

            <div className="space-y-3">
              {/* English Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description (English) *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter product description in English..."
                  rows={4}
                  className={'w-full rounded-xl border-2 bg-white py-3 px-4 ' + (errors.description ? 'border-red-300' : 'border-gray-200')}
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              {/* Gujarati Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description (Gujarati) *
                </label>
                <textarea
                  value={formData.descriptionGu}
                  onChange={(e) => handleChange('descriptionGu', e.target.value)}
                  placeholder="ગુજરાતીમાં પ્રોડક્ટનું વર્ણન દાખલ કરો..."
                  rows={4}
                  className={'w-full rounded-xl border-2 bg-white py-3 px-4 ' + (errors.descriptionGu ? 'border-red-300' : 'border-gray-200')}
                />
                {errors.descriptionGu && <p className="mt-1 text-sm text-red-600">{errors.descriptionGu}</p>}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Tags (Optional)</h2>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                placeholder="e.g., engine, piston, mahindra"
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 px-4"
              />
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Settings</h2>

            <div className="space-y-3">
              {/* Active */}
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Active</span>
                <button
                  type="button"
                  onClick={() => handleChange('isActive', !formData.isActive)}
                  className={'relative h-12 w-20 rounded-full transition-colors ' + (formData.isActive ? 'bg-green-500' : 'bg-gray-300')}
                >
                  <span
                    className={'absolute top-1 h-10 w-10 rounded-full bg-white shadow transition-transform ' + (formData.isActive ? 'translate-x-9' : 'translate-x-1')}
                  />
                </button>
              </label>

              {/* Featured */}
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Featured</span>
                <button
                  type="button"
                  onClick={() => handleChange('isFeatured', !formData.isFeatured)}
                  className={'relative h-12 w-20 rounded-full transition-colors ' + (formData.isFeatured ? 'bg-primary-500' : 'bg-gray-300')}
                >
                  <span
                    className={'absolute top-1 h-10 w-10 rounded-full bg-white shadow transition-transform ' + (formData.isFeatured ? 'translate-x-9' : 'translate-x-1')}
                  />
                </button>
              </label>
            </div>
          </div>

          {/* Save Button (Mobile) */}
          <button
            type="submit"
            disabled={submitting || uploadedImages.some(img => img.uploading)}
            className="w-full rounded-2xl bg-primary-500 py-4 text-center font-semibold text-white disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Product'}
          </button>
        </form>
      </main>
    </div>
  );
}
