/**
 * botEngine.js — Closed-domain intent engine for the AI Image World assistant.
 *
 * Pure, framework-free helpers. The bot is deliberately scoped to THIS site:
 * it answers questions about AI Image World, recommends prompts pulled from the
 * site's own content, and routes users to the right category. Anything outside
 * that scope gets a polite "I can only help with AI Image World" nudge.
 */

/* --------------------------------- helpers -------------------------------- */

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalize(text = '') {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Crude singular-ish form so "mens"/"prompts" match "men"/"prompt". */
function singular(word = '') {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith('es')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1);
  return word;
}

function tokens(text = '') {
  return normalize(text)
    .split(' ')
    .filter(Boolean)
    .map(singular);
}

// Words that carry no topical signal — dropped when extracting a search query.
const STOP_WORDS = new Set([
  'prompt', 'prompts', 'recommend', 'recommendation', 'suggest', 'suggestion',
  'show', 'me', 'give', 'idea', 'ideas', 'for', 'some', 'any', 'the', 'a', 'an',
  'of', 'please', 'can', 'you', 'i', 'want', 'need', 'looking', 'to', 'get',
  'find', 'open', 'go', 'category', 'categories', 'image', 'images', 'picture',
  'pictures', 'photo', 'photos', 'ai', 'about', 'best', 'top', 'good', 'nice',
  'cool', 'and', 'with', 'please', 'list', 'have', 'do', 'is', 'are', 'on',
]);

// Synonym expansion so casual words still hit themed categories.
const SYNONYMS = {
  men: ['men', 'man', 'male', 'boy', 'guy', 'gentleman', 'masculine'],
  women: ['women', 'woman', 'female', 'girl', 'lady', 'feminine'],
  kid: ['kid', 'child', 'children', 'baby'],
  nature: ['nature', 'landscape', 'scenery', 'mountain', 'forest', 'outdoor'],
  car: ['car', 'vehicle', 'automobile', 'bike', 'motorcycle'],
  anime: ['anime', 'manga', 'cartoon'],
  animal: ['animal', 'pet', 'wildlife', 'dog', 'cat'],
  fantasy: ['fantasy', 'magic', 'dragon', 'mythical'],
  fashion: ['fashion', 'style', 'outfit', 'clothing', 'dress'],
  food: ['food', 'meal', 'dish', 'cuisine'],
};

/** Expand a token list with known synonyms for better category matching. */
function expand(toks) {
  const out = new Set(toks);
  toks.forEach((t) => {
    Object.entries(SYNONYMS).forEach(([key, group]) => {
      if (group.includes(t)) {
        out.add(key);
        group.forEach((g) => out.add(g));
      }
    });
  });
  return out;
}

/* ---------------------------- category matching --------------------------- */

/**
 * Find the category that best matches the message. Returns the matched
 * category (with a score) or null. Matches on significant words shared between
 * the message and a category's name/slug, with synonym expansion.
 */
export function matchCategory(text, categories = []) {
  if (!categories.length) return null;
  const msg = expand(tokens(text));
  let best = null;

  for (const cat of categories) {
    const nameToks = tokens(`${cat.name} ${cat.slug || ''}`).filter((t) => t.length >= 3);
    if (!nameToks.length) continue;

    let score = 0;
    for (const nt of nameToks) {
      if (msg.has(nt)) score += 2;
      else if ([...msg].some((m) => m.length >= 4 && (m.includes(nt) || nt.includes(m)))) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { ...cat, score };
  }
  return best;
}

/** Build a clean search query from the message (drops filler/stop words). */
export function extractQuery(text) {
  const kept = tokens(text).filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
  return kept.join(' ').trim();
}

/* ----------------------------- intent routing ----------------------------- */

const has = (text, words) => {
  const t = ` ${normalize(text)} `;
  return words.some((w) => t.includes(` ${w} `));
};

/**
 * Classify a user message into an intent the widget knows how to handle.
 * Order matters: more specific intents win.
 */
export function classifyIntent(text, categories = []) {
  const norm = normalize(text);
  if (!norm) return { type: 'fallback' };

  if (has(norm, ['hi', 'hello', 'hey', 'yo', 'hii', 'helo']) && norm.length <= 12) {
    return { type: 'greeting' };
  }
  if (has(norm, ['thanks', 'thank', 'thankyou', 'thx', 'ty'])) {
    return { type: 'thanks' };
  }
  if (has(norm, ['help', 'what can you do', 'how does this work', 'how do you work'])) {
    return { type: 'help' };
  }
  if (
    has(norm, ['what is', 'about', 'who are you', 'what site', 'what website']) &&
    has(norm, ['this', 'site', 'website', 'aiw', 'world', 'you'])
  ) {
    return { type: 'about' };
  }
  if (has(norm, ['copy', 'use', 'how to copy', 'paste', 'download'])) {
    return { type: 'how_copy' };
  }
  if (has(norm, ['trending', 'popular', 'hot', 'viral'])) {
    return { type: 'trending' };
  }

  const wantsPrompt = has(norm, [
    'prompt', 'prompts', 'recommend', 'suggest', 'idea', 'ideas', 'generate', 'create',
  ]);
  const category = matchCategory(text, categories);

  // "mens prompts" / "open men category" → route + offer prompts.
  if (category) {
    return { type: 'category', category, wantsPrompt };
  }
  // "recommend a prompt" with no category → general prompt suggestions.
  if (wantsPrompt) {
    return { type: 'prompts', query: extractQuery(text) };
  }
  if (has(norm, ['category', 'categories', 'browse', 'explore', 'section'])) {
    return { type: 'list_categories' };
  }

  // Last resort: maybe it's still a topic we can search.
  const query = extractQuery(text);
  if (query) return { type: 'prompts', query, soft: true };

  return { type: 'fallback' };
}

/* ------------------------------ canned copy ------------------------------- */

export const GREETING =
  "Hi! I'm the AI Image World assistant ✨ Ask me for prompts, or tell me a vibe " +
  "(like “men's prompts” or “fantasy”) and I'll open the right category for you.";

export const SUGGESTION_CHIPS = [
  "Men's prompts",
  'Recommend a prompt',
  'Show trending',
  'How do I copy a prompt?',
];

/** Static answers for site-scoped questions. */
export const ANSWERS = {
  about:
    'AI Image World is a gallery of AI-generated images — each one paired with the exact ' +
    'prompt used to make it. Browse by category, copy any prompt, and recreate it in ' +
    'Midjourney, DALL·E, Flux and more. Want me to recommend a few prompts?',
  help:
    'I can help you 3 ways:\n• 🎨 Recommend prompts from our gallery\n• 🗂️ Open the right category ' +
    '(try “men”, “nature”, “anime”…)\n• 📋 Show how to copy & reuse a prompt\nWhat would you like?',
  how_copy:
    'Easy! Open any image, then hit the “Copy Prompt” button — it copies the full prompt to your ' +
    'clipboard so you can paste it into your favorite AI image tool. Want some prompts to try?',
  thanks: "Anytime! 💜 Ask me for more prompts or a category whenever you like.",
  fallback:
    "I'm focused on AI Image World, so I can only help with prompts and categories here. " +
    'Try “recommend a prompt”, a vibe like “fantasy”, or “show trending”.',
};
