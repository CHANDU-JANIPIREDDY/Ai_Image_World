/**
 * analytics.js — thin tracking helpers over POST /analytics/event.
 *
 * Every call is fire-and-forget (recordEvent swallows errors), and enriches the
 * payload with the anonymous sessionId + device class. Event/target types match
 * the backend enum (visit | image_view | category_view | prompt_copy).
 */

import { recordEvent } from '@/services/analytics.api';
import { getSessionId, getDevice } from './session';

function track(eventType, targetType, targetId) {
  return recordEvent({
    eventType,
    targetType,
    ...(targetId ? { targetId } : {}),
    sessionId: getSessionId(),
    device: getDevice(),
  });
}

/** Site page view. */
export const trackVisit = () => track('visit', 'site');

/** Image detail view. */
export const trackImageView = (imageId) => (imageId ? track('image_view', 'image', imageId) : undefined);

/** Category detail view. */
export const trackCategoryView = (categoryId) =>
  categoryId ? track('category_view', 'category', categoryId) : undefined;

/** Prompt copied for an image. */
export const trackPromptCopy = (imageId) =>
  imageId ? track('prompt_copy', 'image', imageId) : undefined;
