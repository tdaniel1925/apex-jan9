'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LogoUploadProps {
  type: 'header_logo' | 'footer_logo';
  currentUrl?: string | null;
  onUploadComplete?: (url: string, width: number) => void;
  className?: string;
  label?: string;
  description?: string;
  previewBgColor?: string;
}

export function LogoUpload({
  type,
  currentUrl,
  onUploadComplete,
  className,
  label = 'Upload Logo',
  description = 'JPG, PNG, GIF or WebP. Max 5MB.',
  previewBgColor = type === 'header_logo' ? '#ffffff' : '#1e3a5f',
}: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl || currentUrl;

  const resizeImage = useCallback(async (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // For transparent images, fill with background color for preview
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          'image/png',
          0.95
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    setIsUploading(true);

    try {
      // Determine max dimensions based on type
      const maxWidth = type === 'header_logo' ? 300 : 200;
      const maxHeight = type === 'header_logo' ? 100 : 80;

      // Resize image on client side for preview
      const resizedBlob = await resizeImage(file, maxWidth, maxHeight);

      // Show preview
      const previewObjectUrl = URL.createObjectURL(resizedBlob);
      setPreviewUrl(previewObjectUrl);

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/admin/email-branding/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setPreviewUrl(result.url);
      onUploadComplete?.(result.url, result.width);
      toast.success(`${type === 'header_logo' ? 'Header' : 'Footer'} logo uploaded successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setPreviewUrl(null);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  }, [type, onUploadComplete, resizeImage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-3">
        {/* Preview Area */}
        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed transition-colors cursor-pointer overflow-hidden',
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
            isUploading && 'opacity-50 pointer-events-none'
          )}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{ backgroundColor: previewBgColor }}
        >
          <div className="p-4 min-h-[100px] flex items-center justify-center">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt={`${type === 'header_logo' ? 'Header' : 'Footer'} Logo`}
                className="max-w-full max-h-[80px] object-contain"
              />
            ) : (
              <div className="text-center">
                <ImageIcon className={cn(
                  'h-8 w-8 mx-auto mb-2',
                  previewBgColor === '#1e3a5f' ? 'text-white/50' : 'text-muted-foreground/50'
                )} />
                <p className={cn(
                  'text-sm',
                  previewBgColor === '#1e3a5f' ? 'text-white/70' : 'text-muted-foreground'
                )}>
                  Click or drag to upload
                </p>
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Upload button and info */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {label}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
