'use client';

import { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface UploadedImage {
  url: string;
  file: File;
  preview: string;
  uploading?: boolean;
  error?: string;
}

interface ImageUploadProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageUpload({ images, onChange, maxImages = 5, className = '' }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newImages: UploadedImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        continue;
      }

      // Check max images limit
      if (images.length + newImages.length >= maxImages) {
        break;
      }

      // Create preview
      const preview = URL.createObjectURL(file);

      newImages.push({
        url: '', // Will be set after upload
        file,
        preview,
        uploading: true,
      });
    }

    // Add to state immediately for preview
    const updatedImages = [...images, ...newImages];
    onChange(updatedImages);
    setUploadingCount(newImages.length);

    // Upload each image
    for (let i = 0; i < newImages.length; i++) {
      const imageIndex = images.length + i;
      await uploadImage(newImages[i], imageIndex);
    }
  };

  const uploadImage = async (image: UploadedImage, index: number) => {
    const formData = new FormData();
    formData.append('images', image.file);

    try {
      const response = await api.post<{
        success: boolean;
        data: { images: string[]; tempId: string };
      }>('/api/products/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.images?.[0]) {
        // Update the image with the server URL
        onChange((prev) =>
          prev.map((img, idx) =>
            idx === index
              ? { ...img, url: response.data.images[0], uploading: false }
              : img
          )
        );
      }
    } catch (error) {
      console.error('Upload failed:', error);
      onChange((prev) =>
        prev.map((img, idx) =>
          idx === index
            ? { ...img, uploading: false, error: 'Upload failed' }
            : img
        )
      );
    } finally {
      setUploadingCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleRemove = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onChange(updatedImages);
  };

  const handleCameraCapture = () => {
    // Create a file input with capture attribute for camera
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera on mobile
    input.multiple = true;

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      handleFileSelect(target.files);
    };

    input.click();
  };

  const handleGallerySelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleGallerySelect}
          disabled={images.length >= maxImages || uploadingCount > 0}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white py-4 text-gray-600 transition-colors hover:border-primary-500 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ImageIcon className="h-5 w-5" />
          <span className="font-medium">Gallery</span>
        </button>

        <button
          type="button"
          onClick={handleCameraCapture}
          disabled={images.length >= maxImages || uploadingCount > 0}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white py-4 text-gray-600 transition-colors hover:border-primary-500 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="h-5 w-5" />
          <span className="font-medium">Camera</span>
        </button>
      </div>

      {/* Hidden file input for gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div
              key={index}
              className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200"
            >
              {/* Image */}
              <img
                src={image.preview}
                alt={`Upload ${index + 1}`}
                className="h-full w-full object-cover"
              />

              {/* Uploading Overlay */}
              {image.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}

              {/* Error Overlay */}
              {image.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/80">
                  <span className="text-xs text-white text-center px-2">{image.error}</span>
                </div>
              )}

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={image.uploading}
                className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-0"
              >
                <X className="h-4 w-4" />
              </button>

              {/* First Image Badge */}
              {index === 0 && !image.uploading && !image.error && (
                <div className="absolute bottom-1 left-1 rounded-full bg-primary-500 px-2 py-0.5 text-xs font-semibold text-white">
                  Cover
                </div>
              )}
            </div>
          ))}

          {/* Add More Button */}
          {images.length < maxImages && uploadingCount === 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-500 transition-colors"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs mt-1">Add</span>
            </button>
          )}
        </div>
      )}

      {/* Info Text */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{images.length} / {maxImages} images</span>
        <span>Max 5MB per image</span>
      </div>

      {/* Upload Progress */}
      {uploadingCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <span className="text-sm text-blue-600">
            Uploading {uploadingCount} image{uploadingCount > 1 ? 's' : ''}...
          </span>
        </div>
      )}
    </div>
  );
}
