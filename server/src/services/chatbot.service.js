'use strict';

/**
 * services/chatbot.service.js — AI Image World assistant logic.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ READ-ONLY GUARANTEE                                                   │
 * │ Every database call in this file is a `.find()/.lean()` READ. There   │
 * │ is NO create/update/delete/insert anywhere here, so the chatbot can   │
 * │ only access and display content — it can never modify or remove data. │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Flow: pull a little grounding context from the DB (active categories + a
 * few matching prompts), hand it to Gemini, and let the model compose a
 * friendly, on-brand reply plus a structured "open category / show prompts"
 * decision. If Gemini is unavailable, a rule-based fallback answers instead.
 */

const { Category, Image } = require('../models');
const gemini = require('./gemini.service');

/* ----------------------------- read-only queries ---------------------------- */

/** Active categories (name + slug) for grounding and routing. READ-ONLY. */
async function getActiveCategories() {
  return Category.find({ isActive: true })
    .select('name slug imageCount')
    .sort({ sortOrder: 1, name: 1 })
    .limit(40)
    .lean();
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Find a few published prompts matching the user's message. READ-ONLY.
 * Tries full-text search first, then falls back to a case-insensitive regex
 * across title/prompt/tags/category.
 */
async function findPrompts(query, limit = 4) {
  const q = (query || '').trim();
  if (!q) return [];

  let docs = [];
  try {
    docs = await Image.find(
      { $text: { $search: q }, status: 'published' },
      {
        score: { $meta: 'textScore' },
        title: 1,
        slug: 1,
        prompt: 1,
        categoryName: 1,
        thumbnailUrl: 1,
      }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();
  } catch {
    docs = [];
  }

  if (!docs.length) {
    const rx = new RegExp(escapeRegex(q), 'i');
    docs = await Image.find(
      {
        status: 'published',
        $or: [{ title: rx }, { prompt: rx }, { tags: rx }, { categoryName: rx }],
      },
      'title slug prompt categoryName thumbnailUrl'
    )
      .sort({ views: -1, publishedAt: -1 })
      .limit(limit)
      .lean();
  }

  return docs.map((d) => ({
    id: String(d._id),
    title: d.title,
    slug: d.slug,
    prompt: d.prompt,
    category: d.categoryName,
    thumbnailUrl: d.thumbnailUrl,
  }));
}

/* ------------------------------- Gemini glue -------------------------------- */

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reply: { type: 'STRING' },
    // Slug of a category to open, or '' for none. Must come from the list given.
    categorySlug: { type: 'STRING' },
    // Whether to display the prompt cards the server already fetched.
    showPrompts: { type: 'BOOLEAN' },
  },
  required: ['reply', 'categorySlug', 'showPrompts'],
};

function buildSystemPrompt(categories) {
  const catLines = categories.map((c) => `- ${c.name} (slug: ${c.slug})`).join('\n');
  return [
    'You are the friendly assistant for "AI Image World" — a website that showcases',
    'AI-generated images, each paired with the exact text prompt used to create it.',
    'Visitors browse by category, copy prompts, and recreate them in tools like',
    'Midjourney, DALL·E and Flux.',
    '',
    'STRICT RULES:',
    '1. ONLY help with AI Image World: prompts, categories, how to copy/use prompts,',
    '   trending content, and navigating the site. If asked anything unrelated',
    '   (math, news, coding, personal advice, other websites, etc.), politely decline',
    '   and steer back to prompts/categories.',
    '2. You can ONLY read and display existing site content. Never claim you can',
    '   create, change, upload, or delete anything. If asked to modify data, explain',
    '   you can only browse and recommend.',
    '3. Keep replies short, warm and stylish (1-3 sentences). A few emojis are fine.',
    '4. Use ONLY the categories listed below. To send the user to one, put its exact',
    '   slug in "categorySlug" (e.g. for "men\'s prompts" → the Men category).',
    '   If none fit, use "".',
    '5. Set "showPrompts" to true whenever the user wants prompt ideas/recommendations',
    '   or asks about a topic we found prompts for.',
    '',
    'Available categories:',
    catLines || '(none configured yet)',
  ].join('\n');
}

function buildUserTurn(message, prompts) {
  const promptBlock = prompts.length
    ? prompts
        .map((p, i) => `${i + 1}. [${p.category || 'Uncategorized'}] ${p.title}: ${String(p.prompt).slice(0, 180)}`)
        .join('\n')
    : '(no matching prompts found in the gallery)';
  return [
    `User message: "${message}"`,
    '',
    'Prompts I found in the gallery for this message (you may reference these,',
    'but do NOT paste their full text — the site will display them as cards):',
    promptBlock,
  ].join('\n');
}

/** Map stored chat history to Gemini `contents` turns (user/model). */
function toContents(history, currentTurn) {
  const turns = (history || [])
    .slice(-6)
    .filter((m) => m && m.text)
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.text).slice(0, 1000) }],
    }));
  turns.push({ role: 'user', parts: [{ text: currentTurn }] });
  return turns;
}

/* ----------------------------- rule-based fallback -------------------------- */

/** Loose token match so "mens prompts" → "Mens Trend". */
function matchCategory(message, categories) {
  const words = message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .map((w) => (w.endsWith('s') ? w.slice(0, -1) : w)); // crude singular

  return (
    categories.find((c) => {
      const hay = `${c.name} ${c.slug}`.toLowerCase();
      return words.some((w) => hay.includes(w));
    }) || null
  );
}

/** Used when Gemini isn't configured or errors out. Still read-only + on-site. */
function fallbackReply(message, categories, prompts) {
  const match = matchCategory(message, categories);
  if (prompts.length) {
    return {
      reply: match
        ? `Here are some “${match.name}” prompts you can copy 👇`
        : 'Here are a few prompts you can copy 👇',
      categorySlug: match ? match.slug : '',
      showPrompts: true,
    };
  }
  if (match) {
    return {
      reply: `Opening the “${match.name}” category for you 🎨`,
      categorySlug: match.slug,
      showPrompts: false,
    };
  }
  return {
    reply:
      "I'm your AI Image World assistant — ask me for prompts or a vibe " +
      '(like “men”, “nature”, “anime”) and I’ll find the right ones. ✨',
    categorySlug: '',
    showPrompts: false,
  };
}

/* --------------------------------- answer ----------------------------------- */

/**
 * Produce a chatbot reply for a user message.
 * @param {object} opts { message, history? }
 * @returns {Promise<{ reply, prompts, action }>}
 */
async function answer({ message, history = [] } = {}) {
  const [categories, prompts] = await Promise.all([
    getActiveCategories(),
    findPrompts(message, 4),
  ]);

  let decision;
  if (gemini.isConfigured()) {
    try {
      const raw = await gemini.generate({
        system: buildSystemPrompt(categories),
        contents: toContents(history, buildUserTurn(message, prompts)),
        schema: RESPONSE_SCHEMA,
        temperature: 0.6,
      });
      decision = JSON.parse(raw);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[chatbot] Gemini fallback:', err.message);
      decision = fallbackReply(message, categories, prompts);
    }
  } else {
    decision = fallbackReply(message, categories, prompts);
  }

  // Validate the category slug against real categories (never trust the model).
  const cat = decision.categorySlug
    ? categories.find((c) => c.slug === decision.categorySlug)
    : null;

  return {
    reply: decision.reply || "Here's what I found 👇",
    prompts: decision.showPrompts ? prompts.slice(0, 3) : [],
    action: cat ? { label: `Open ${cat.name}`, slug: cat.slug } : null,
  };
}

module.exports = { answer };
