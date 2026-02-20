'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';

interface Category {
  id: string;
  name: string;
  nameGu: string;
  slug: string;
  description: string;
  descriptionGu: string;
  image: string | null;
  displayOrder: number;
  featured: boolean;
  isActive: boolean;
  parentId: string | null;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    nameGu: '',
    slug: '',
    description: '',
    descriptionGu: '',
    displayOrder: 0,
    featured: false,
    isActive: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [existingImage, setExistingImage] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }

    if (params.id) {
      fetchCategory(params.id as string);
    }
  }, [isAuthenticated, user, router, hasHydrated, params.id]);

  const fetchCategory = async (id: string) => {
    try {
      const response = await api.get<{ success: boolean; data: Category }>(`/api/categories/admin/all`);
      const cat = response.data?.find((c: Category) => c.id === id);
      if (cat) {
        setCategory(cat);
        setFormData({
          name: cat.name,
          nameGu: cat.nameGu,
          slug: cat.slug,
          description: cat.description || '',
          descriptionGu: cat.descriptionGu || '',
          displayOrder: cat.displayOrder,
          featured: cat.featured,
          isActive: cat.isActive,
        });
        if (cat.image) {
          setExistingImage(cat.image);
          setImagePreview(cat.image);
        }
      } else {
        router.push('/admin/categories');
      }
    } catch (err) {
      router.push('/admin/categories');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(existingImage || '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeExistingImage = () => {
    setExistingImage('');
    setImagePreview('');
    setImageFile(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return existingImage || null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post<{ success: boolean; data: { image: string } }>(
        '/api/categories/upload-image',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      return response.data?.image || null;
    } catch (err) {
      setError('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.nameGu || !formData.slug) {
      setError('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = existingImage;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          setSaving(false);
          return;
        }
      }

      await api.put(`/api/categories/${params.id}`, {
        ...formData,
        image: imageUrl,
      });

      router.push('/admin/categories');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-primary-500 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/categories')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Edit Category</h1>
        </div>
      </header>

      <main className="px-4 py-6">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          {/* Image Upload */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Image</h2>
            <div className="flex flex-col items-center">
              {imagePreview ? (
                <div className="relative w-full aspect-square max-w-[200px]">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={imageFile ? removeImage : removeExistingImage}
                    className="absolute -top-2 -right-2 h-8 w-8 flex items-center justify-center rounded-full bg-red-500 text-white shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-square max-w-[200px] border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors"
                >
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Tap to upload image</p>
                  <p className="text-xs text-gray-400 mt-1">Max 5MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 flex items-center gap-2 rounded-full bg-primary-500 px-6 py-2 text-white font-semibold hover:bg-primary-600"
              >
                <Upload className="h-4 w-4" />
                {imagePreview ? 'Change Image' : 'Select Image'}
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (English) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Engine Parts"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-primary-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (Gujarati) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nameGu}
                onChange={(e) => setFormData({ ...formData, nameGu: e.target.value })}
                placeholder="e.g., એન્જિન પાર્ટ્સ"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-primary-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., engine-parts"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                title="Only lowercase letters, numbers, and hyphens allowed"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-primary-500 focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (English)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Category description in English..."
                rows={3}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-primary-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Gujarati)
              </label>
              <textarea
                value={formData.descriptionGu}
                onChange={(e) => setFormData({ ...formData, descriptionGu: e.target.value })}
                placeholder="ગુજરાતીમાં શ્રેણી વર્ણન..."
                rows={3}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-primary-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Settings</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-primary-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">Featured Category</p>
                <p className="text-sm text-gray-500">Show on homepage</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, featured: !formData.featured })}
                className={'relative w-14 h-8 rounded-full transition-colors ' + (formData.featured ? 'bg-primary-500' : 'bg-gray-300')}
              >
                <span className={'absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ' + (formData.featured ? 'translate-x-7' : 'translate-x-1')} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">Active</p>
                <p className="text-sm text-gray-500">Show in app</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={'relative w-14 h-8 rounded-full transition-colors ' + (formData.isActive ? 'bg-primary-500' : 'bg-gray-300')}
              >
                <span className={'absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ' + (formData.isActive ? 'translate-x-7' : 'translate-x-1')} />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary-500 py-4 text-white font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving || uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {uploading ? 'Uploading...' : 'Saving...'}
              </>
            ) : (
              'Update Category'
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
