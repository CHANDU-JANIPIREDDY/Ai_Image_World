import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';

import {
  getImages,
  getTrendingImages,
  getLatestImages,
  getImageBySlug,
  copyPrompt,
  likeImage,
  unlikeImage,
  createImage,
  updateImage,
  deleteImage,
} from '@/services/images.api';

/**
 * hooks/useImages.js — React Query hooks for images.
 * Exposes lists (incl. infinite scroll), trending, detail, and copy mutation.
 */

// Query-key factory — predictable, easy to invalidate.
export const imageKeys = {
  all: ['images'],
  list: (filters = {}) => ['images', 'list', filters],
  infinite: (filters = {}) => ['images', 'infinite', filters],
  trending: (params = {}) => ['images', 'trending', params],
  latest: () => ['images', 'latest'],
  detail: (slug) => ['images', 'detail', slug],
};

// Shared next-page resolver based on the envelope meta.
const getNextPageParam = (lastPage) => {
  const meta = lastPage?.meta;
  if (!meta) return undefined;
  return meta.page < meta.totalPages ? meta.page + 1 : undefined;
};

/** Paginated/infinite image list with arbitrary filters (category, tag, sort…). */
export function useInfiniteImages(filters = {}) {
  return useInfiniteQuery({
    queryKey: imageKeys.infinite(filters),
    queryFn: ({ pageParam = 1 }) => getImages({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam,
  });
}

/** Latest images (homepage masonry, infinite scroll). */
export function useLatestImages() {
  return useInfiniteQuery({
    queryKey: imageKeys.latest(),
    queryFn: ({ pageParam = 1 }) => getLatestImages({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam,
  });
}

/** Trending images (single fetch). */
export function useTrendingImages(params = {}) {
  return useQuery({
    queryKey: imageKeys.trending(params),
    queryFn: () => getTrendingImages(params),
  });
}

/** Single image detail by slug. */
export function useImageBySlug(slug) {
  return useQuery({
    queryKey: imageKeys.detail(slug),
    queryFn: () => getImageBySlug(slug),
    enabled: Boolean(slug),
  });
}

/** Increment prompt-copy count; refresh the detail entry on success. */
export function useCopyPrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => copyPrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imageKeys.all });
    },
  });
}

/**
 * Like / unlike an image. The button owns the optimistic count + persisted
 * liked state, so these mutations are fire-and-forget — we deliberately do NOT
 * invalidate the detail query (that would re-trigger the server view increment).
 */
export function useLikeImage() {
  return useMutation({ mutationFn: (id) => likeImage(id) });
}

export function useUnlikeImage() {
  return useMutation({ mutationFn: (id) => unlikeImage(id) });
}

/* ------------------------------ Admin management ----------------------------- */

/**
 * Page-based image list for the admin table. Admins are authenticated, so the
 * backend returns all statuses (draft/scheduled/published).
 */
export function useAdminImages(filters = {}) {
  return useQuery({
    queryKey: imageKeys.list({ admin: true, ...filters }),
    queryFn: () => getImages(filters),
    placeholderData: keepPreviousData,
  });
}

/** Create / update / delete an image, invalidating image caches. */
export function useImageMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: imageKeys.all });

  const create = useMutation({ mutationFn: createImage, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, payload }) => updateImage(id, payload),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: (id) => deleteImage(id), onSuccess: invalidate });

  return { create, update, remove };
}
