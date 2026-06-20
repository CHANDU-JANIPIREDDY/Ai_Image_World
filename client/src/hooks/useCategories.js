import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/categories.api';

/**
 * hooks/useCategories.js — React Query hooks for categories.
 */

export const categoryKeys = {
  all: ['categories'],
  list: (params = {}) => ['categories', 'list', params],
  detail: (slug, params = {}) => ['categories', 'detail', slug, params],
};

/** List of categories (defaults to active). */
export function useCategories(params = {}) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => getCategories(params),
    staleTime: 5 * 60 * 1000, // categories change rarely
  });
}

/** A category plus its published images (paginated). */
export function useCategoryBySlug(slug, params = {}) {
  return useQuery({
    queryKey: categoryKeys.detail(slug, params),
    queryFn: () => getCategoryBySlug(slug, params),
    enabled: Boolean(slug),
  });
}

/* -------------------------------- Mutations -------------------------------- */

/** Create / update / delete a category, invalidating category caches. */
export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: categoryKeys.all });

  const create = useMutation({ mutationFn: createCategory, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, payload }) => updateCategory(id, payload),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: ({ id, force }) => deleteCategory(id, force),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
