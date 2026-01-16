/**
 * Email Logo Upload API
 * POST - Upload and resize logo for email templates
 *
 * Accepts: header_logo or footer_logo as type
 * Resizes images to fit while maintaining aspect ratio
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';

// Constants for validation
const VALID_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Max dimensions for logos
const MAX_HEADER_WIDTH = 300;
const MAX_HEADER_HEIGHT = 100;
const MAX_FOOTER_WIDTH = 200;
const MAX_FOOTER_HEIGHT = 80;

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const logoType = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!logoType || !['header_logo', 'footer_logo'].includes(logoType)) {
      return NextResponse.json({ error: 'Invalid logo type. Use header_logo or footer_logo.' }, { status: 400 });
    }

    // Validate file type
    if (!VALID_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPG, PNG, GIF, or WebP.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine max dimensions based on logo type
    const maxWidth = logoType === 'header_logo' ? MAX_HEADER_WIDTH : MAX_FOOTER_WIDTH;
    const maxHeight = logoType === 'header_logo' ? MAX_HEADER_HEIGHT : MAX_FOOTER_HEIGHT;

    // Get image dimensions and resize using sharp (if available) or just upload as-is
    let finalBuffer: Buffer | Uint8Array = buffer;
    let finalWidth = maxWidth;

    try {
      // Try to use sharp for resizing if available
      const sharp = await import('sharp').catch(() => null);

      if (sharp) {
        const image = sharp.default(buffer);
        const metadata = await image.metadata();

        if (metadata.width && metadata.height) {
          // Calculate new dimensions maintaining aspect ratio
          const aspectRatio = metadata.width / metadata.height;

          let newWidth = metadata.width;
          let newHeight = metadata.height;

          // Scale down if exceeds max dimensions
          if (newWidth > maxWidth) {
            newWidth = maxWidth;
            newHeight = Math.round(newWidth / aspectRatio);
          }

          if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = Math.round(newHeight * aspectRatio);
          }

          finalWidth = newWidth;

          // Resize image
          const resizedImage = await image
            .resize(newWidth, newHeight, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .png() // Convert to PNG for transparency support
            .toBuffer();

          finalBuffer = resizedImage;
        }
      }
    } catch (sharpError) {
      console.warn('Sharp not available, uploading original image:', sharpError);
      // Continue without resizing if sharp is not available
    }

    // Generate unique filename
    const fileName = `email-logos/${logoType}_${Date.now()}.png`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('public-assets')
      .upload(fileName, finalBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);

      // Check if bucket doesn't exist
      if (uploadError.message?.includes('Bucket not found')) {
        // Try with 'avatars' bucket as fallback
        const { data: fallbackData, error: fallbackError } = await supabase
          .storage
          .from('avatars')
          .upload(fileName, finalBuffer, {
            contentType: 'image/png',
            upsert: true,
          });

        if (fallbackError) {
          return NextResponse.json(
            { error: 'Storage not configured. Please create a storage bucket in Supabase.' },
            { status: 500 }
          );
        }

        // Get public URL from fallback bucket
        const { data: urlData } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(fallbackData.path);

        return NextResponse.json({
          success: true,
          url: urlData.publicUrl,
          width: finalWidth,
          type: logoType,
        });
      }

      return NextResponse.json(
        { error: 'Upload failed. Please try again.' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('public-assets')
      .getPublicUrl(uploadData.path);

    // Update branding settings in database
    const updateField = logoType === 'header_logo' ? 'header_logo_url' : 'footer_logo_url';
    const widthField = logoType === 'header_logo' ? 'header_logo_width' : 'footer_logo_width';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbError } = await (supabase as any)
      .from('email_branding_settings')
      .update({
        [updateField]: urlData.publicUrl,
        [widthField]: finalWidth,
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows (should be just one)

    if (dbError) {
      console.warn('Failed to update branding settings:', dbError);
      // Don't fail the upload, just log warning
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      width: finalWidth,
      type: logoType,
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
