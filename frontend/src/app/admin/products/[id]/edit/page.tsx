'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';
import { ImageUpload } from '@/components/ImageUpload';

interface Product {
  id: string;
  name: string;
  nameGu: string;
  slug: string;
  description: string;
  descriptionGu: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  images: string[];
  categoryId: string;
  category?: {
    id: string;
    name: string;
    nameGu: string;
  };
  tags: string[];
  weight?: number;
  isActive: boolean;
  isFeatured: boolean;
}

interface Category {
  id: string;
  name: string;
  nameGu: string;
}

interface UploadedImage {
  url: string;
  file?: File;
  preview: string;
  uploading?: boolean;
  error?: string;
  isExisting?: boolean;
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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { user, isAuthenticated, hasHydrated, clearAuth } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (productId) {
      fetchProduct();
      fetchCategories();
    }
  }, [isAuthenticated, user, router, hasHydrated, productId]);

  const fetchProduct = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Product }>(`/api/products/id/${productId}`);
      setProduct(response.data);

      if (response.data) {
        setFormData({
          name: response.data.name,
          nameGu: response.data.nameGu,
          slug: response.data.slug,
          description: response.data.description,
          descriptionGu: response.data.descriptionGu,
          price: response.data.price.toString(),
          compareAtPrice: response.data.compareAtPrice?.toString() || '',
          sku: response.data.sku,
          stock: response.data.stock.toString(),
          categoryId: response.data.categoryId,
          isActive: response.data.isActive,
          isFeatured: response.data.isFeatured || false,
          weight: response.data.weight?.toString() || '',
          tags: response.data.tags.join(', '),
        });

        if (response.data.images?.length > 0) {
          setUploadedImages(
            response.data.images.map((url) => ({
              url,
              preview: url,
              isExisting: true,
            }))
          );
        }
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Category[] }>('/api/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.nameGu.trim()) newErrors.nameGu = 'Gujarati name is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.descriptionGu.trim()) newErrors.descriptionGu = 'Gujarati description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';

    const hasUploadedImages = uploadedImages.length > 0 && uploadedImages.some(img => img.url && !img.uploading && !img.error);
    if (!hasUploadedImages) newErrors.images = 'At least one image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (uploadedImages.some(img => img.uploading)) {
      setErrors({ general: 'Please wait for images to finish uploading' });
      return;
    }

    setSaving(true);
    try {
      const imageUrls = uploadedImages
        .filter(img => img.url && !img.error && !img.uploading)
        .map(img => img.url);

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

      await api.put(`/api/products/${productId}`, payload);

      // Redirect to view page after save
      router.push(`/admin/products/${productId}`);
    } catch (error: any) {
      if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: 'Failed to update product' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imageIndex: number) => {
    const imageToDelete = uploadedImages[imageIndex];

    if (!imageToDelete.isExisting) {
      setUploadedImages(prev => prev.filter((_, i) => i !== imageIndex));
      return;
    }

    try {
      await api.delete(`/api/products/${productId}/images/${imageIndex}`);
      setUploadedImages(prev => prev.filter((_, i) => i !== imageIndex));
    } catch (error) {
      console.error('Failed to delete image:', error);
      setErrors({ general: 'Failed to delete image' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Product not found</p>
          <button onClick={() => router.push('/admin/products')} className="mt-4 text-primary-600 font-semibold">
            Go back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-primary-500 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/admin/products/${productId}`)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Edit Product</h1>
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
              onClick={() => router.push(`/admin/products/${productId}`)}
              className="flex h-10 items-center gap-2 rounded-full bg-gray-400 px-4 text-sm font-semibold text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploadedImages.some(img => img.uploading)}
              className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-primary-600 font-semibold disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-4xl mx-auto">
        {errors.general && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-red-600">
            {errors.general}
          </div>
        )}

        {/* Product Images */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Product Images</h2>
          <ImageUpload
            images={uploadedImages}
            onChange={(newImages) => {
              // Check if any images were removed
              if (newImages.length < uploadedImages.length) {
                // Find which image was removed
                const removedIndex = uploadedImages.findIndex((img, idx) =>
                  !newImages.some((newImg) => newImg.preview === img.preview)
                );
                if (removedIndex !== -1 && uploadedImages[removedIndex].isExisting) {
                  // Delete from server
                  handleDeleteImage(removedIndex);
                }
              }
              setUploadedImages(newImages);
            }}
            maxImages={5}
          />
          {errors.images && <p className="mt-2 text-sm text-red-600">{errors.images}</p>}
        </div>

        {/* Basic Information */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Product Name (English) *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={'w-full rounded-xl border-2 bg-white py-3 px-4 ' + (errors.name ? 'border-red-300' : 'border-gray-200')}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Product Name (Gujarati) *</label>
              <input
                type="text"
                value={formData.nameGu}
                onChange={(e) => handleChange('nameGu', e.target.value)}
                className={'w-full rounded-xl border-2 bg-white py-3 px-4 ' + (errors.nameGu ? 'border-red-300' : 'border-gray-200')}
              />
              {errors.nameGu && <p className="mt-1 text-sm text-red-600">{errors.nameGu}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">SKU *</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                className={'w-full rounded-xl border-2 bg-white py-3 px-4 ' + (errors.sku ? 'border-red-300' : 'border-gray-200')}
              />
              {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                className={'w-full rounded-xl border-2 bg-white py-3 px-4 ' + (errors.categoryId ? 'border-red-300' : 'border-gray-200')}
              >
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
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Pricing & Stock</h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className={'w-full rounded-xl border-2 bg-white py-3 px-4 ' + (errors.price ? 'border-red-300' : 'border-gray-200')}
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Compare At Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.compareAtPrice}
                onChange={(e) => handleChange('compareAtPrice', e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 px-4"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Stock</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 px-4"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description (English) *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className={'w-full rounded-xl border-2 bg-white py-3 px-4 ' + (errors.description ? 'border-red-300' : 'border-gray-200')}
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description (Gujarati) *</label>
              <textarea
                value={formData.descriptionGu}
                onChange={(e) => handleChange('descriptionGu', e.target.value)}
                rows={4}
                className={'w-full rounded-xl border-2 bg-white py-3 px-4 ' + (errors.descriptionGu ? 'border-red-300' : 'border-gray-200')}
              />
              {errors.descriptionGu && <p className="mt-1 text-sm text-red-600">{errors.descriptionGu}</p>}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Settings</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Active</span>
              <button
                type="button"
                onClick={() => handleChange('isActive', !formData.isActive)}
                className={'relative h-12 w-20 rounded-full transition-colors ' + (formData.isActive ? 'bg-green-500' : 'bg-gray-300')}
              >
                <span className={'absolute top-1 h-10 w-10 rounded-full bg-white shadow transition-transform ' + (formData.isActive ? 'translate-x-9' : 'translate-x-1')} />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Featured</span>
              <button
                type="button"
                onClick={() => handleChange('isFeatured', !formData.isFeatured)}
                className={'relative h-12 w-20 rounded-full transition-colors ' + (formData.isFeatured ? 'bg-primary-500' : 'bg-gray-300')}
              >
                <span className={'absolute top-1 h-10 w-10 rounded-full bg-white shadow transition-transform ' + (formData.isFeatured ? 'translate-x-9' : 'translate-x-1')} />
              </button>
            </label>
          </div>
        </div>
      </main>
    </div>
  );
}
