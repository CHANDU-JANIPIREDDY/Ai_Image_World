import { Helmet } from 'react-helmet-async';

/**
 * Seo — centralizes per-page document head: title, meta description, and
 * Open Graph / Twitter card tags. Pass a page `title` (site name is appended),
 * an optional `description`, and an optional `image` (absolute URL) for rich
 * link previews.
 */

const SITE = 'AI Image World';
const DEFAULT_DESCRIPTION =
  'Browse thousands of AI-generated images and copy professional prompts.';

export function Seo({ title, description = DEFAULT_DESCRIPTION, image, type = 'website' }) {
  const fullTitle = title ? `${title} — ${SITE}` : `${SITE} — Discover AI Images & Prompts`;
  const url = typeof window !== 'undefined' ? window.location.href : undefined;
  const card = image ? 'summary_large_image' : 'summary';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}

      {/* Twitter */}
      <meta name="twitter:card" content={card} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}
