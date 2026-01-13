'use client';

import { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Camera, Loader2, Upload, X, ZoomIn, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentUrl?: string | null;
  initials: string;
  onUploadComplete?: (url: string) => void;
  className?: string;
}

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function AvatarUpload({
  currentUrl,
  initials,
  onUploadComplete,
  className,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropping state
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);

  const displayUrl = previewUrl || currentUrl;

  const onCropComplete = useCallback((_croppedArea: unknown, croppedAreaPixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Create a cropped image from the original
  const createCroppedImage = useCallback(async (
    imageSrc: string,
    pixelCrop: CroppedAreaPixels,
    rotation: number
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const rotRad = getRadianAngle(rotation);

    // Calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    // Set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // Translate canvas context to center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    // Draw rotated image
    ctx.drawImage(image, 0, 0);

    // Extract the cropped image
    const data = ctx.getImageData(
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height
    );

    // Set canvas to the final output size (square for avatar)
    const outputSize = 400; // Output a 400x400 image
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Create a temporary canvas for the crop
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = pixelCrop.width;
    tempCanvas.height = pixelCrop.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
      throw new Error('Could not get temp canvas context');
    }

    tempCtx.putImageData(data, 0, 0);

    // Draw the cropped image scaled to output size
    ctx.drawImage(
      tempCanvas,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        },
        'image/jpeg',
        0.9
      );
    });
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    setError(null);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB.');
      return;
    }

    // Read file and show cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageToCrop(result);
      setShowCropper(true);
      // Reset cropping state
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleCropConfirm = useCallback(async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    setShowCropper(false);
    setIsUploading(true);

    try {
      // Create cropped image blob
      const croppedBlob = await createCroppedImage(imageToCrop, croppedAreaPixels, rotation);

      // Show preview
      const previewUrl = URL.createObjectURL(croppedBlob);
      setPreviewUrl(previewUrl);

      // Upload to server
      const formData = new FormData();
      formData.append('file', croppedBlob, 'avatar.jpg');

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setPreviewUrl(result.url);
      onUploadComplete?.(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      setImageToCrop(null);
    }
  }, [imageToCrop, croppedAreaPixels, rotation, createCroppedImage, onUploadComplete]);

  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
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
    <>
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-4">
          {/* Avatar with upload overlay */}
          <div
            className={cn(
              'relative group cursor-pointer',
              isDragging && 'ring-2 ring-primary ring-offset-2 rounded-full'
            )}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={displayUrl || undefined}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Hover overlay */}
            <div className={cn(
              'absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity',
              isUploading && 'opacity-100'
            )}>
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <Camera className="h-8 w-8 text-white" />
              )}
            </div>
          </div>

          {/* Upload button and info */}
          <div className="space-y-1">
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
                  Change Photo
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, GIF or WebP. Max 10MB.
            </p>
            <p className="text-xs text-muted-foreground">
              You can crop and adjust your photo.
            </p>
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

      {/* Cropping Dialog */}
      <Dialog open={showCropper} onOpenChange={(open) => !open && handleCropCancel()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crop Your Photo</DialogTitle>
            <DialogDescription>
              Drag to reposition, scroll to zoom, and adjust your profile picture.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Cropper Area */}
            <div className="relative w-full h-72 bg-muted rounded-lg overflow-hidden">
              {imageToCrop && (
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              )}
            </div>

            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Zoom</span>
              </div>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(values) => setZoom(values[0])}
              />
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RotateCw className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Rotation</span>
              </div>
              <Slider
                value={[rotation]}
                min={0}
                max={360}
                step={1}
                onValueChange={(values) => setRotation(values[0])}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCropCancel}>
              Cancel
            </Button>
            <Button onClick={handleCropConfirm}>
              Apply & Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper functions for image manipulation

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number): { width: number; height: number } {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}
