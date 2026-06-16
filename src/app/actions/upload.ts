'use server';

import { requireStaff } from '@/lib/auth';
import { saveUploadedImage } from '@/lib/upload';

export async function uploadImageAction(formData: FormData): Promise<{ url: string } | { error: string }> {
  await requireStaff();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'No file provided.' };
  return saveUploadedImage(file);
}
