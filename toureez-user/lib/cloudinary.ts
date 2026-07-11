

import { Config } from '../constants/config';
import type { ApiResponse, CloudinaryUploadResult } from '../types';


const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${Config.cloudinaryCloudName}/image/upload`;

// ── Internal helpers ──────────────────────────────────────────────────────────


function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred during upload.';
}


function isValidLocalUri(uri: string): boolean {
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseCloudinaryUploadResult(
  value: unknown
): { data: CloudinaryUploadResult | null; error: string | null } {
  if (!isRecord(value)) {
    return { data: null, error: 'Cloudinary returned an invalid response.' };
  }

  if (isRecord(value.error)) {
    const message = value.error.message;
    return {
      data: null,
      error: `Cloudinary error: ${
        typeof message === 'string' ? message : 'Upload failed.'
      }`,
    };
  }

  const {
    public_id: publicId,
    secure_url: secureUrl,
    original_filename: originalFilename,
    format,
    width,
    height,
    bytes,
  } = value;

  if (
    typeof publicId !== 'string' ||
    typeof secureUrl !== 'string' ||
    typeof originalFilename !== 'string' ||
    typeof format !== 'string' ||
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    typeof bytes !== 'number'
  ) {
    return { data: null, error: 'Cloudinary returned incomplete upload data.' };
  }

  return {
    data: {
      public_id: publicId,
      secure_url: secureUrl,
      original_filename: originalFilename,
      format,
      width,
      height,
      bytes,
    },
    error: null,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────


export async function uploadImage(
  localUri: string,
  folder: string = 'toureez'
): Promise<ApiResponse<CloudinaryUploadResult>> {
  try {
    if (!localUri || localUri.trim().length === 0) {
      return { data: null, error: 'Image URI is required.' };
    }

    if (!isValidLocalUri(localUri)) {
      return {
        data: null,
        error: 'Invalid image URI. Expected a local file path.',
      };
    }

    // Determine the file extension from the URI
    const uriParts = localUri.split('.');
    const fileExtension = uriParts[uriParts.length - 1]?.toLowerCase() ?? 'jpg';

    // Map extension to MIME type
    const mimeTypeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      heic: 'image/heic',
      heif: 'image/heif',
    };

    // Reject anything outside this allow-list rather than silently
    // defaulting to image/jpeg — Cloudinary's unsigned image/upload endpoint
    // will still accept SVG (which can carry inline script) unless the
    // client refuses to send it in the first place.
    const mimeType = mimeTypeMap[fileExtension];
    if (!mimeType) {
      return { data: null, error: 'Only JPG, PNG, WEBP, or HEIC/HEIF images are allowed.' };
    }

    // Build multipart form data for the upload
    const formData = new FormData();

    // React Native's FormData accepts { uri, name, type } objects for files.
    // The `as unknown as Blob` cast is required because RN's FormData type
    // differs from the browser's Blob-based FormData — this is unavoidable.
    formData.append('file', {
      uri: localUri,
      name: `upload.${fileExtension}`,
      type: mimeType,
    } as unknown as Blob);

    formData.append('upload_preset', Config.cloudinaryUploadPreset);
    formData.append('folder', folder);

    // Enforce max 800×800 output via Cloudinary's incoming transformation.
    // This runs server-side so the stored asset is already resized — no need
    // to resize on-device before upload. The unsigned preset must allow
    // incoming_transformation for this to take effect.
    formData.append(
      'transformation',
      'c_limit,w_800,h_800,f_auto,q_auto'
    );

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: {
        // Do NOT set Content-Type manually — fetch sets it automatically
        // with the correct multipart boundary when body is FormData.
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        data: null,
        error: `Cloudinary upload failed (${response.status}): ${errorBody}`,
      };
    }

    const result: unknown = await response.json();
    const parsed = parseCloudinaryUploadResult(result);

    if (parsed.error || !parsed.data) {
      return { data: null, error: parsed.error };
    }

    return { data: parsed.data, error: null };
  } catch (err) {
    return {
      data: null,
      error: `uploadImage: ${extractErrorMessage(err)}`,
    };
  }
}


export function getTransformedUrl(
  publicId: string,
  width: number,
  height: number,
  crop: 'fill' | 'fit' | 'crop' | 'thumb' = 'fill'
): string {
  return `https://res.cloudinary.com/${Config.cloudinaryCloudName}/image/upload/c_${crop},w_${width},h_${height},f_auto,q_auto/${publicId}`;
}


export function getOptimisedUrl(publicId: string): string {
  return `https://res.cloudinary.com/${Config.cloudinaryCloudName}/image/upload/f_auto,q_auto/${publicId}`;
}
