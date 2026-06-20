import { useQuery } from '@tanstack/react-query';

import {
  getSummary,
  getTopImages,
  getTopCategories,
  getTopSearches,
} from '@/services/analytics.api';

/**
 * hooks/useAnalytics.js — React Query hooks for the admin analytics reports
 * (all require an authenticated admin; backend gates them).
 */

export const analyticsKeys = {
  all: ['analytics'],
  summary: (params = {}) => ['analytics', 'summary', params],
  topImages: (params = {}) => ['analytics', 'top-images', params],
  topCategories: (params = {}) => ['analytics', 'top-categories', params],
  topSearches: (params = {}) => ['analytics', 'top-searches', params],
};

export function useAnalyticsSummary(params = {}) {
  return useQuery({
    queryKey: analyticsKeys.summary(params),
    queryFn: () => getSummary(params),
  });
}

export function useTopImages(params = {}) {
  return useQuery({
    queryKey: analyticsKeys.topImages(params),
    queryFn: () => getTopImages(params),
  });
}

export function useTopCategories(params = {}) {
  return useQuery({
    queryKey: analyticsKeys.topCategories(params),
    queryFn: () => getTopCategories(params),
  });
}

export function useTopSearches(params = {}) {
  return useQuery({
    queryKey: analyticsKeys.topSearches(params),
    queryFn: () => getTopSearches(params),
  });
}
