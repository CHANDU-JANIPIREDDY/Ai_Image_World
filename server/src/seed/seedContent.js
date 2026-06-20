'use strict';

/**
 * src/seed/seedContent.js — Launch content seeder.
 *
 * Resets the demo gallery and generates the 20 launch categories (high-demand
 * AI content niches) and 100 published images themed per category, plus a
 * bounded set of analytics visits and search logs so the admin dashboards have
 * real data to render.
 *
 * NOTE: this performs a DEMO RESET — it deletes existing categories and images
 * before seeding, so the gallery launches with exactly these categories. The
 * superadmin account is preserved.
 *
 * Run with:  npm run seed:content
 */

const slugify = require('slugify');

const { connectDB, disconnectDB } = require('../config/db');
const { Category, Image, Analytics, SearchLog } = require('../models');
const { ensureSuperAdmin } = require('./seedSuperAdmin');
const { dayKey, monthKey } = require('../utils/dateKeys');

/* --------------------------- deterministic randomness --------------------------- */
// mulberry32 — small seeded PRNG so re-runs produce stable demo data.
function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(20240620);
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const titleCase = (s) =>
  s.replace(/\b\w/g, (c) => c.toUpperCase());

/* ------------------------------ launch categories ------------------------------ */
// name · description · subject (used to theme each category's image prompts)
const CATEGORIES = [
  ['Anime Art', 'Vibrant anime and manga-style AI characters and scenes.', 'anime character'],
  ['Ghibli Style', 'Studio Ghibli–inspired painterly worlds and moments.', 'Studio Ghibli inspired scene'],
  ['AI Portraits', 'Photorealistic AI-generated human portraits.', 'realistic portrait'],
  ['Cyberpunk', 'Neon-soaked futuristic cities and characters.', 'futuristic neon city'],
  ['Fantasy Worlds', 'Magical landscapes, creatures, and epic realms.', 'magical fantasy landscape'],
  ['Gaming Characters', 'Game-inspired heroes, villains, and avatars.', 'game-inspired hero character'],
  ['Fashion Photography', 'Luxury editorial and runway fashion shoots.', 'luxury fashion editorial shoot'],
  ['Product Advertising', 'Commercial product renders and ad creatives.', 'commercial product advertisement render'],
  ['Logo Design', 'Modern, minimal logo and brand-mark concepts.', 'modern minimalist logo concept'],
  ['YouTube Thumbnails', 'High-CTR, viral YouTube thumbnail designs.', 'viral YouTube thumbnail design'],
  ['3D Renders', 'Polished 3D visualizations and CGI scenes.', '3D visualization render'],
  ['Architecture', 'Striking building concepts and exteriors.', 'modern architecture building concept'],
  ['Interior Design', 'Beautiful room interiors and decor concepts.', 'interior room design'],
  ['Nature Photography', 'Breathtaking landscapes and natural scenes.', 'nature landscape photograph'],
  ['Cars & Supercars', 'Luxury cars, supercars, and concept vehicles.', 'luxury supercar'],
  ['Space Exploration', 'Planets, astronauts, and cosmic vistas.', 'space exploration scene with astronaut'],
  ['Concept Art', 'Cinematic concept designs for film and games.', 'cinematic concept art design'],
  ['Digital Art', 'Bold, creative digital artwork and illustration.', 'creative digital artwork'],
  ['Sci-Fi Art', 'Futuristic science-fiction worlds and tech.', 'futuristic sci-fi scene'],
  ['Character Design', 'Original character sheets and turnarounds.', 'original character design'],
];

const STYLES = ['cinematic', 'hyper-detailed', 'volumetric lighting', 'dramatic', 'ultra-realistic', 'dreamlike', 'studio-lit', 'moody', 'vivid', 'ethereal'];
const TOOLS = ['Midjourney', 'DALL·E 3', 'Stable Diffusion', 'Flux', 'Firefly'];
const COMMON_TAGS = ['4k', '8k', 'detailed', 'trending', 'concept', 'render', 'wide-shot', 'closeup', 'lighting', 'masterpiece'];
const VARIANTS = ['Portrait', 'Scene', 'Concept', 'Showcase', 'Study'];

function thumb(slug, w, h, i) {
  return `https://picsum.photos/seed/${slug}-${i}/${w}/${h}`;
}

/* ------------------------------ category seeding ------------------------------- */
async function seedCategories() {
  const docs = CATEGORIES.map(([name, description], i) => {
    const slug = slugify(name, { lower: true, strict: true });
    return {
      name,
      slug,
      description,
      thumbnailUrl: thumb(slug, 600, 450, 0),
      isActive: true,
      sortOrder: i,
      seoTitle: `${name} AI Images & Prompts`,
      seoDescription: description,
    };
  });
  return Category.insertMany(docs);
}

/* -------------------------------- image seeding -------------------------------- */
async function seedImages(categories) {
  const imageDocs = [];
  const viewsByCat = {};
  let counter = 0;

  categories.forEach((cat, idx) => {
    const subject = CATEGORIES[idx][2];
    for (let n = 1; n <= 5; n += 1) {
      counter += 1;
      const variant = VARIANTS[n - 1];
      const title = `${titleCase(subject)} ${variant}`;
      const slug = `${cat.slug}-${n}`;
      const views = randInt(120, 8000);
      viewsByCat[cat._id] = (viewsByCat[cat._id] || 0) + views;
      const daysAgo = randInt(0, 60);

      const tags = Array.from(
        new Set([
          cat.slug,
          ...subject.toLowerCase().split(' ').slice(0, 2),
          pick(COMMON_TAGS),
        ])
      ).slice(0, 6);

      imageDocs.push({
        title,
        slug,
        imageUrl: thumb(slug, 800, 1000, n),
        thumbnailUrl: thumb(slug, 400, 500, n),
        prompt: `${titleCase(pick(STYLES))} ${subject}, ${pick(STYLES)}, highly detailed, ${pick(COMMON_TAGS)}, created with ${pick(TOOLS)}`,
        negativePrompt: 'blurry, low quality, watermark, distorted, deformed',
        category: cat._id,
        categoryName: cat.name,
        tags,
        views,
        promptCopyCount: randInt(0, 1200),
        featured: counter % 8 === 0,
        status: 'published',
        sourceAiTool: pick(TOOLS),
        publishedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        seoTitle: title,
        seoDescription: `${title} — AI-generated ${cat.name} image with prompt.`,
      });
    }
  });

  await Image.insertMany(imageDocs);

  // Refresh denormalized category counters.
  await Promise.all(
    categories.map((cat) =>
      Category.updateOne(
        { _id: cat._id },
        { $set: { imageCount: 5, views: viewsByCat[cat._id] || 0 } }
      )
    )
  );

  return imageDocs.length;
}

/* ------------------------- analytics + search log seeding ----------------------- */
// Raw inserts so we can backdate createdAt across the trailing 30 days.
async function seedAnalytics() {
  const devices = ['mobile', 'tablet', 'desktop'];
  const visits = [];
  for (let d = 0; d < 30; d += 1) {
    const when = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
    const count = randInt(8, 60);
    for (let i = 0; i < count; i += 1) {
      visits.push({
        eventType: 'visit',
        targetType: 'site',
        sessionId: `seed-${d}-${i}`,
        device: pick(devices),
        day: dayKey(when),
        month: monthKey(when),
        createdAt: when,
      });
    }
  }
  await Analytics.deleteMany({ sessionId: /^seed-/ });
  if (visits.length) await Analytics.collection.insertMany(visits);
  return visits.length;
}

async function seedSearchLogs() {
  const queries = [
    'anime', 'ghibli', 'ai portrait', 'cyberpunk', 'fantasy', 'gaming character',
    'fashion', 'product ad', 'logo', 'youtube thumbnail', '3d render', 'architecture',
    'interior design', 'nature', 'supercar', 'space', 'concept art', 'digital art',
    'sci-fi', 'character design',
  ];
  const images = await Image.find({}, '_id').limit(20).lean();
  const logs = [];
  for (let i = 0; i < 140; i += 1) {
    const when = new Date(Date.now() - randInt(0, 14) * 24 * 60 * 60 * 1000);
    const q = pick(queries);
    logs.push({
      query: q,
      rawQuery: q,
      resultsCount: randInt(0, 40),
      clickedImageId: rng() > 0.5 && images.length ? pick(images)._id : undefined,
      sessionId: `seed-search-${i}`,
      device: 'desktop',
      day: dayKey(when),
      month: monthKey(when),
      createdAt: when,
    });
  }
  await SearchLog.deleteMany({ sessionId: /^seed-search-/ });
  await SearchLog.collection.insertMany(logs);
  return logs.length;
}

/* ----------------------------------- runner ------------------------------------ */
async function run() {
  await connectDB();
  await ensureSuperAdmin();

  /* eslint-disable no-console */
  console.log('🧹 Demo reset — removing existing categories and images…');
  await Image.deleteMany({});
  await Category.deleteMany({});

  console.log('🌱 Seeding launch categories…');
  const categories = await seedCategories();
  console.log(`   ${categories.length} categories ready.`);

  console.log('🌱 Seeding images…');
  const imageCount = await seedImages(categories);
  console.log(`   ${imageCount} published images ready.`);

  console.log('🌱 Seeding analytics visits…');
  const visits = await seedAnalytics();
  console.log(`   ${visits} visit events.`);

  console.log('🌱 Seeding search logs…');
  const searches = await seedSearchLogs();
  console.log(`   ${searches} search logs.`);

  console.log('✅ Content seed complete.');
  /* eslint-enable no-console */
}

if (require.main === module) {
  run()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      // eslint-disable-next-line no-console
      console.error('❌ Content seed failed:', err);
      await disconnectDB();
      process.exit(1);
    });
}

module.exports = { run };
