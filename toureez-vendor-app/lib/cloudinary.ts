

import * as ImagePicker from 'expo-image-picker';
import { Config } from '../constants/config';
import type { CloudinaryUploadResult } from '../types';


export async function pickAndUploadImage(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
}): Promise<CloudinaryUploadResult | null> {
  // Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access photos was denied.');
  }

  // Launch picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: options?.allowsEditing ?? true,
    aspect: options?.aspect ?? [4, 3],
    quality: 0.85,
  });

  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  if (!asset) return null;

  if (asset.mimeType && !Config.acceptedImageTypes.includes(asset.mimeType as typeof Config.acceptedImageTypes[number])) {
    throw new Error('Only JPG, PNG, or WebP images are allowed.');
  }
  if (asset.fileSize && asset.fileSize > Config.maxImageSizeBytes) {
    throw new Error(`Image must be smaller than ${Math.round(Config.maxImageSizeBytes / (1024 * 1024))}MB.`);
  }

  return uploadToCloudinary(asset.uri);
}


export async function uploadToCloudinary(localUri: string): Promise<CloudinaryUploadResult> {
  const cloudName = Config.cloudinaryCloudName;
  const preset = Config.cloudinaryUploadPreset;

  // Guard against unconfigured placeholder values
  if (cloudName === 'your-cloud-name' || !cloudName) {
    throw new Error(
      'Cloudinary is not configured. Open Toureez-vendor-app/.env and set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME to your Cloudinary cloud name.',
    );
  }

  const formData = new FormData();

  // React Native FormData accepts file objects with uri/name/type
  formData.append('file', {
    uri: localUri,
    name: 'upload.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  formData.append('upload_preset', preset);
  formData.append('folder', 'toureez/vendor');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData },
  );

  if (!response.ok) {
    let errDetail = '';
    try {
      const errJson = await response.json() as { error?: { message?: string } };
      errDetail = errJson?.error?.message ?? (await response.text());
    } catch {
      errDetail = `HTTP ${response.status}`;
    }
    throw new Error(`Upload failed: ${errDetail}`);
  }

  const data = await response.json() as CloudinaryUploadResult;
  return data;
}
