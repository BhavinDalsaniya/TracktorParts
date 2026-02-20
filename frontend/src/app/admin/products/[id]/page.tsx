'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft, Edit, Save, X, Trash2, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
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
  shortDescription?: string;
  shortDescriptionGu?: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  images: string[];
  thumbnail?: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    nameGu: string;
  };
  tags: string[];
  specifications?: Record<string, any>;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  isActive: boolean;
  isFeatured: boolean;
  isReturnable: boolean;
  warrantyDays?: number;
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
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

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  const { user, isAuthenticated, hasHydrated, clearAuth } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
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

  // Auto-enter edit mode if ?edit=true is in URL
  useEffect(() => {
    if (product && searchParams.get('edit') === 'true') {
      setEditing(true);
    }
  }, [product, searchParams]);

  const fetchProduct = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Product }>(`/api/products/id/${productId}`);
      setProduct(response.data);

      // Initialize form data
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

        // Initialize images as UploadedImage format
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

  const handleEdit = () => {
    router.push(`/admin/products/${productId}/edit`);
  };

  const handleCancel = () => {
    setEditing(false);
    if (product) {
      setFormData({
        name: product.name,
        nameGu: product.nameGu,
        slug: product.slug,
        description: product.description,
        descriptionGu: product.descriptionGu,
        price: product.price.toString(),
        compareAtPrice: product.compareAtPrice?.toString() || '',
        sku: product.sku,
        stock: product.stock.toString(),
        categoryId: product.categoryId,
        isActive: product.isActive,
        isFeatured: product.isFeatured || false,
        weight: product.weight?.toString() || '',
        tags: product.tags.join(', '),
      });
      // Reset images to original
      setUploadedImages(
        product.images.map((url) => ({
          url,
          preview: url,
          isExisting: true,
        }))
      );
    }
    setErrors({});
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

  const handleImageUpload = async (formData: FormData) => {
    // Check if all images are uploaded and valid
    const hasValidImages = uploadedImages.length > 0 &&
      uploadedImages.some(img => img.url && !img.uploading && !img.error);

    if (!hasValidImages) {
      return { success: false, error: 'At least one valid image is required' };
    }

    return { success: true };
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

    // Check for at least one uploaded image
    const hasUploadedImages = uploadedImages.length > 0 && uploadedImages.some(img => img.url && !img.uploading && !img.error);
    if (!hasUploadedImages) newErrors.images = 'At least one image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    // Check if any images are still uploading
    if (uploadedImages.some(img => img.uploading)) {
      setErrors({ general: 'Please wait for images to finish uploading' });
      return;
    }

    setSaving(true);
    try {
      // Get the image URLs (both existing and newly uploaded)
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

      // Refresh product data
      await fetchProduct();
      setEditing(false);
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/api/products/${productId}`);
      router.push('/admin/products');
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleDeleteImage = async (imageIndex: number) => {
    const imageToDelete = uploadedImages[imageIndex];

    // If it's a newly uploaded image, just remove it from the list
    if (!imageToDelete.isExisting) {
      setUploadedImages(prev => prev.filter((_, i) => i !== imageIndex));
      return;
    }

    // If it's an existing image, delete from server
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
              onClick={() => router.push('/admin/products')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Product Details</h1>
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
            {!editing ? (
              <>
                <button
                  onClick={handleDelete}
                  className="flex h-10 items-center gap-2 rounded-full bg-red-400 px-4 text-sm font-semibold text-white"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  onClick={handleEdit}
                  className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-primary-600 font-semibold"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex h-10 items-center gap-2 rounded-full bg-gray-400 px-4 text-sm font-semibold text-white"
                >
                  <X className="h-4 w-4" />
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
              </>
            )}
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

          {editing ? (
            <>
              <ImageUpload
                images={uploadedImages}
                onChange={setUploadedImages}
                maxImages={5}
              />
              {errors.images && <p className="mt-2 text-sm text-red-600">{errors.images}</p>}
            </>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {uploadedImages.map((image, index) => (
                <div key={index} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={image.preview} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h2>

          {editing ? (
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
          ) : (
            <div className="space-y-2">
              <p><span className="font-semibold text-gray-700">Name:</span> {product.nameGu || product.name}</p>
              <p><span className="font-semibold text-gray-700">English Name:</span> {product.name}</p>
              <p><span className="font-semibold text-gray-700">SKU:</span> <span className="font-mono">{product.sku}</span></p>
              <p><span className="font-semibold text-gray-700">Category:</span> {product.category?.name} ({product.category?.nameGu})</p>
            </div>
          )}
        </div>

        {/* Pricing & Stock */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Pricing & Stock</h2>

          {editing ? (
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
          ) : (
            <div className="space-y-2">
              <p><span className="font-semibold text-gray-700">Price:</span> {formatPrice(product.price)}</p>
              {product.compareAtPrice && (
                <p><span className="font-semibold text-gray-700">Compare At Price:</span> {formatPrice(product.compareAtPrice)}</p>
              )}
              <p><span className="font-semibold text-gray-700">Stock:</span> {product.stock} units</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>

          {editing ? (
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
          ) : (
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-gray-700 mb-1">English:</p>
                <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">Gujarati:</p>
                <p className="text-gray-600 whitespace-pre-wrap">{product.descriptionGu}</p>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Settings</h2>

          {editing ? (
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
          ) : (
            <div className="space-y-2">
              <p><span className="font-semibold text-gray-700">Status:</span> <span className={product.isActive ? 'text-green-600' : 'text-red-600'}>{product.isActive ? 'Active' : 'Inactive'}</span></p>
              <p><span className="font-semibold text-gray-700">Featured:</span> {product.isFeatured ? 'Yes' : 'No'}</p>
              <p><span className="font-semibold text-gray-700">Created:</span> {new Date(product.createdAt).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
