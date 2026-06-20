import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';

import { searchImages, getSearchSuggestions } from '@/services/search.api';

/**
 * hooks/useSearch.js — React Query hooks for search.
 * useInfiniteSearch: paginated text-search results.
 * useSearchSuggestions: autocomplete (enabled at >= 2 chars).
 */

export const searchKeys = {
  all: ['search'],
  results: (params = {}) => ['search', 'results', params],
  suggestions: (q) => ['search', 'suggestions', q],
};

const getNextPageParam = (lastPage) => {
  const meta = lastPage?.meta;
  if (!meta) return undefined;
  return meta.page < meta.totalPages ? meta.page + 1 : undefined;
};

/** Infinite search results. `q` must be non-empty to run. */
export function useInfiniteSearch({ q, category, sort } = {}) {
  const enabled = Boolean(q && q.trim().length >= 1);
  return useInfiniteQuery({
    queryKey: searchKeys.results({ q, category, sort }),
    queryFn: ({ pageParam = 1 }) => searchImages({ q, category, sort, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam,
    enabled,
    placeholderData: keepPreviousData, // keep old results visible while refetching
  });
}

/** Page-based search results (used by the Search page with Pagination). */
export function useSearchResults({ q, category, sort = 'relevance', page = 1, limit = 24 } = {}) {
  const enabled = Boolean(q && q.trim());
  return useQuery({
    queryKey: searchKeys.results({ q, category, sort, page, limit }),
    queryFn: () => searchImages({ q, category, sort, page, limit }),
    enabled,
    placeholderData: keepPreviousData, // keep prior page visible while loading next
  });
}

/** Autocomplete suggestions (titles/categories/tags). */
export function useSearchSuggestions(q) {
  const enabled = Boolean(q && q.trim().length >= 2);
  return useQuery({
    queryKey: searchKeys.suggestions(q),
    queryFn: () => getSearchSuggestions(q),
    enabled,
    staleTime: 30 * 1000,
  });
}
