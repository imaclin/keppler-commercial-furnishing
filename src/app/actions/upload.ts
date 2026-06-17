'use server';

import { getProfile, requireStaff } from '@/lib/auth';
import { saveUploadedImage, saveUploadedFile, type SavedFile } from '@/lib/upload';

export async function uploadImageAction(formData: FormData): Promise<{ url: string } | { error: string }> {
  await requireStaff();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'No file provided.' };
  return saveUploadedImage(file);
}

// Message attachment upload: available to any signed-in user (customer or staff).
export async function uploadFileAction(formData: FormData): Promise<SavedFile | { error: string }> {
  const profile = await getProfile();
  if (!profile) return { error: 'Please sign in.' };
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'No file provided.' };
  return saveUploadedFile(file);
}
