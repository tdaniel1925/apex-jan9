// SPEC: SPEC-WORKFLOWS > WF-5
// Photo upload section with crop modal

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PhotoCropModal } from "@/components/dashboard/photo-crop-modal";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";
import { updatePhoto } from "@/lib/actions";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

type PhotoUploadSectionProps = {
  currentPhotoUrl: string | null;
  distributorId: string;
  firstName: string;
  lastName: string;
};

export function PhotoUploadSection({
  currentPhotoUrl,
  distributorId,
  firstName,
  lastName,
}: PhotoUploadSectionProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    // Read file and open crop modal
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setIsModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob, cropData: Record<string, unknown>) => {
    setIsUploading(true);

    try {
      // Get Supabase client
      const supabase = createBrowserSupabaseClient();

      // Generate filename
      const filename = `${distributorId}-${Date.now()}.webp`;
      const filePath = `profile-photos/${filename}`;

      // Delete old photo if exists
      if (photoUrl && photoUrl.includes("supabase")) {
        const oldFilename = photoUrl.split("/").pop();
        if (oldFilename) {
          await supabase.storage
            .from("profile-photos")
            .remove([`${oldFilename}`]);
        }
      }

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, croppedBlob, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      const newPhotoUrl = data.publicUrl;

      // Update database
      const result = await updatePhoto(newPhotoUrl, cropData);

      if (result.success) {
        setPhotoUrl(newPhotoUrl);
        setIsModalOpen(false);
        setImageSrc(null);
        toast.success("Photo updated successfully!");
      } else {
        throw new Error(result.error || "Failed to update photo");
      }
    } catch (error) {
      // Error handled
      toast.error(error instanceof Error ? error.message : "Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoUrl) return;

    const confirmed = confirm("Are you sure you want to remove your photo?");
    if (!confirmed) return;

    setIsUploading(true);

    try {
      // Delete from storage
      if (photoUrl.includes("supabase")) {
        const supabase = createBrowserSupabaseClient();
        const filename = photoUrl.split("/").pop();
        if (filename) {
          await supabase.storage
            .from("profile-photos")
            .remove([filename]);
        }
      }

      // Update database
      const result = await updatePhoto("", undefined);

      if (result.success) {
        setPhotoUrl(null);
        toast.success("Photo removed successfully!");
      } else {
        throw new Error(result.error || "Failed to remove photo");
      }
    } catch (error) {
      // Error handled
      toast.error("Failed to remove photo");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <Avatar className="h-32 w-32">
        <AvatarImage src={photoUrl || undefined} />
        <AvatarFallback className="text-4xl">
          {firstName[0]}
          {lastName[0]}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => document.getElementById("photo-upload")?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {photoUrl ? "Change Photo" : "Upload Photo"}
          </Button>

          {photoUrl && (
            <Button
              variant="outline"
              onClick={handleRemovePhoto}
              disabled={isUploading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Photo
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          JPG, PNG or WebP. Max size 5MB. Recommended: square image, at least 400x400px.
        </p>

        <input
          id="photo-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {imageSrc && (
        <PhotoCropModal
          isOpen={isModalOpen}
          imageSrc={imageSrc}
          onClose={() => {
            setIsModalOpen(false);
            setImageSrc(null);
          }}
          onCropComplete={handleCropComplete}
          isUploading={isUploading}
        />
      )}
    </div>
  );
}
