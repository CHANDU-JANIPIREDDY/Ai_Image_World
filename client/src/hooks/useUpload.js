import { useMutation } from '@tanstack/react-query';

import { uploadImage } from '@/services/upload.api';

/**
 * useUploadImage — upload a file to Cloudinary via POST /upload/image.
 * Returns the mutation; `data` resolves to { imageUrl, thumbnailUrl, publicId, … }.
 */
export function useUploadImage() {
  return useMutation({
    mutationFn: ({ file, folder }) => uploadImage(file, folder),
  });
}
