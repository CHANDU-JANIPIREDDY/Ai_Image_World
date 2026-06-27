import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, Copy, Check, ArrowRight } from 'lucide-react';

import { cn } from '@/utils/cn';
import { useCategories } from '@/hooks/useCategories';
import { searchImages } from '@/services/search.api';
import { sendChatMessage } from '@/services/chatbot.api';
import {
  classifyIntent,
  GREETING,
  SUGGESTION_CHIPS,
  ANSWERS,
} from './botEngine';

/**
 * Chatbot — a small, glassy, site-scoped assistant for AI Image World.
 *
 * Floating launcher (bottom-right) → opens a compact chat panel. The bot
 * recommends prompts pulled from the site's own search API and routes users
 * to the matching category. It never answers anything off-site.
 */

let messageId = 0;
const nextId = () => `m${(messageId += 1)}`;

const botMsg = (extra) => ({ id: nextId(), role: 'bot', ...extra });
const userMsg = (text) => ({ id: nextId(), role: 'user', text });

/** Fetch up to `limit` prompt cards for a query (best-effort). */
async function fetchPrompts(query, limit = 3) {
  try {
    const res = await searchImages({ q: query, limit, sort: 'relevance' });
    const items = res?.data || [];
    return items.slice(0, limit).map((img) => ({
      id: img._id || img.id || img.slug,
      title: img.title,
      prompt: img.prompt,
      slug: img.slug,
      category: img.categoryName,
    }));
  } catch {
    return [];
  }
}

/* ------------------------------- sub-views -------------------------------- */

function PromptCard({ item }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.prompt || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  };
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
      <p className="line-clamp-3 text-[11px] leading-snug text-content/90 sm:text-[12.5px]">{item.prompt}</p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-lg bg-primary/90 px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-primary"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        {item.slug && (
          <Link
            to={`/image/${item.slug}`}
            className="inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium text-content-muted transition-colors hover:text-content"
          >
            View <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ msg, onChip }) {
  const isBot = msg.role === 'bot';
  return (
    <div className={cn('flex', isBot ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-[11.5px] leading-relaxed sm:text-[13px]',
          isBot
            ? 'rounded-tl-sm bg-white/5 text-content ring-1 ring-white/10'
            : 'rounded-tr-sm bg-primary text-white'
        )}
      >
        {msg.text && <p className="whitespace-pre-line">{msg.text}</p>}

        {/* Prompt result cards */}
        {msg.prompts?.length > 0 && (
          <div className="mt-2 space-y-2">
            {msg.prompts.map((p) => (
              <PromptCard key={p.id} item={p} />
            ))}
          </div>
        )}

        {/* Navigation action (e.g. "Open Men category") */}
        {msg.actions?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {msg.actions.map((a) => (
              <Link
                key={a.to + a.label}
                to={a.to}
                onClick={a.onClick}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-gradient px-3 py-1.5 text-[12px] font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]"
              >
                {a.label} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        )}

        {/* Quick-reply chips */}
        {msg.chips?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.chips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChip(c)}
                className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11.5px] text-content-muted transition-colors hover:border-primary/40 hover:text-content"
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-content-muted"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * BotAvatar — a clean, modern robot/assistant face drawn as inline SVG so it
 * scales crisply and recolors via `currentColor` (white over the brand gradient).
 * `animate` adds a gentle eye-blink to make it feel alive on the launcher.
 */
function BotAvatar({ className, animate = false }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      {/* antenna */}
      <line x1="16" y1="3.5" x2="16" y2="7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="3" r="1.7" fill="currentColor" />
      {/* head */}
      <rect x="5.5" y="7.5" width="21" height="17" rx="6" stroke="currentColor" strokeWidth="2" />
      {/* side ears */}
      <path d="M5.5 14.5H3.2M26.5 14.5h2.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* eyes (blink on the launcher) */}
      <motion.g
        fill="currentColor"
        animate={animate ? { scaleY: [1, 1, 0.1, 1, 1] } : undefined}
        transition={animate ? { duration: 4, repeat: Infinity, times: [0, 0.92, 0.95, 0.98, 1] } : undefined}
        style={{ transformOrigin: '16px 15.5px' }}
      >
        <circle cx="12" cy="15.5" r="2" />
        <circle cx="20" cy="15.5" r="2" />
      </motion.g>
      {/* smile */}
      <path d="M12.5 19.8c1 .9 2.2 1.4 3.5 1.4s2.5-.5 3.5-1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * WelcomeIntro — the first thing users see: a big avatar, a "How can I help
 * you?" headline, and tappable starter chips. Shown until the first message.
 */
function WelcomeIntro({ onChip }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center px-2 pt-6 text-center"
    >
      <div className="relative">
        <span className="absolute inset-0 -z-10 animate-ping rounded-3xl bg-primary/30" />
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl border border-white/25 bg-white/10 shadow-glass ring-1 ring-white/15 backdrop-blur-xl">
          <BotAvatar className="h-9 w-9 text-white" animate />
        </div>
      </div>

      <h3 className="mt-4 bg-gradient-to-r from-white to-content-muted bg-clip-text text-lg font-bold text-transparent">
        How can I help you?
      </h3>
      <p className="mt-1 max-w-[16rem] text-[12.5px] leading-relaxed text-content-muted">
        I'm your AI Image World assistant. Ask me for prompts or a vibe — I'll
        find the perfect ones and open the right category.
      </p>

      <div className="mt-4 flex w-full flex-col gap-2">
        {SUGGESTION_CHIPS.map((c, i) => (
          <motion.button
            key={c}
            type="button"
            onClick={() => onChip(c)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07 }}
            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-left text-[13px] text-content transition-colors hover:border-primary/40 hover:bg-white/10"
          >
            {c}
            <ArrowRight className="h-4 w-4 text-content-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* -------------------------------- widget ---------------------------------- */

function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  // Empty until the first interaction — the WelcomeIntro ("How can I help
  // you?") stands in for an initial bot message.
  const [messages, setMessages] = useState([]);

  const { data: catData } = useCategories({ active: true });
  const categories = catData?.data || [];

  // On the home page the launcher sits over the full-bleed hero — keep it hidden
  // there and fade it in once the user scrolls past (most of) the first screen.
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setScrolledPastHero(true);
      return undefined;
    }
    const onScroll = () => setScrolledPastHero(window.scrollY > window.innerHeight * 0.6);
    onScroll(); // sync on mount / route change
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  // Hidden while over the hero (and not already opened).
  const hiddenOverHero = isHome && !scrolledPastHero && !open;

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Keep the latest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy, open]);

  // Focus the input when the panel opens.
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  // Collapse the auto-grown textarea back to one line after a message is sent.
  useEffect(() => {
    if (input === '' && inputRef.current) inputRef.current.style.height = 'auto';
  }, [input]);

  const push = useCallback((msg) => setMessages((prev) => [...prev, msg]), []);

  /**
   * Offline fallback — a rule-based reply used only when the AI endpoint is
   * unreachable (e.g. server down or Gemini unconfigured). Keeps the bot useful
   * with no network. Busy-state is handled by the `respond` orchestrator.
   */
  const respondLocal = useCallback(
    async (text) => {
      const intent = classifyIntent(text, categories);
      {
        switch (intent.type) {
          case 'greeting':
            push(botMsg({ text: GREETING, chips: SUGGESTION_CHIPS }));
            break;

          case 'about':
            push(botMsg({ text: ANSWERS.about, chips: ["Men's prompts", 'Recommend a prompt'] }));
            break;

          case 'help':
            push(botMsg({ text: ANSWERS.help, chips: SUGGESTION_CHIPS }));
            break;

          case 'thanks':
            push(botMsg({ text: ANSWERS.thanks }));
            break;

          case 'how_copy':
            push(botMsg({ text: ANSWERS.how_copy, chips: ['Recommend a prompt', 'Show trending'] }));
            break;

          case 'trending': {
            const prompts = await fetchPrompts('trending', 3);
            push(
              botMsg({
                text: '🔥 Here are some trending picks. Want the full feed?',
                prompts,
                actions: [{ label: 'See all trending', to: '/trending' }],
              })
            );
            break;
          }

          case 'category': {
            const { category, wantsPrompt } = intent;
            const prompts = wantsPrompt ? await fetchPrompts(category.name, 3) : [];
            push(
              botMsg({
                text: wantsPrompt
                  ? `Here are some “${category.name}” prompts — or open the full category:`
                  : `Got it! Opening the “${category.name}” category for you:`,
                prompts,
                actions: [
                  { label: `Open ${category.name}`, to: `/category/${category.slug}` },
                ],
              })
            );
            break;
          }

          case 'prompts': {
            const q = intent.query;
            const prompts = q ? await fetchPrompts(q, 3) : [];
            if (prompts.length) {
              push(
                botMsg({
                  text: intent.soft
                    ? `Here's what I found for “${q}”:`
                    : `Here are a few${q ? ` “${q}”` : ''} prompts you can copy:`,
                  prompts,
                })
              );
            } else {
              // Nothing matched — steer back to browsable categories.
              push(
                botMsg({
                  text: q
                    ? `I couldn't find prompts for “${q}”. Try a category instead:`
                    : 'Tell me a vibe and I’ll pull matching prompts. Or pick a category:',
                  chips: categories.slice(0, 5).map((c) => c.name),
                  actions: [{ label: 'Browse all categories', to: '/categories' }],
                })
              );
            }
            break;
          }

          case 'list_categories':
            push(
              botMsg({
                text: 'Here are some categories to explore:',
                chips: categories.slice(0, 6).map((c) => c.name),
                actions: [{ label: 'View all categories', to: '/categories' }],
              })
            );
            break;

          default:
            push(botMsg({ text: ANSWERS.fallback, chips: SUGGESTION_CHIPS }));
        }
      }
    },
    [categories, push]
  );

  /** Render an AI reply payload ({ reply, prompts, action }) as a bot message. */
  const renderReply = useCallback(
    ({ reply, prompts, action }) => {
      push(
        botMsg({
          text: reply,
          prompts: prompts?.length ? prompts : undefined,
          actions: action ? [{ label: action.label, to: `/category/${action.slug}` }] : undefined,
        })
      );
    },
    [push]
  );

  /** Ask the server (Gemini + read-only DB). Throws on any failure. */
  const respondViaApi = useCallback(
    async (text, history) => {
      const res = await sendChatMessage({ message: text, history });
      const data = res?.data;
      if (!data || !data.reply) throw new Error('Empty reply');
      renderReply(data);
    },
    [renderReply]
  );

  /**
   * Orchestrator: try the AI endpoint first, fall back to the local rule-based
   * engine if it fails, and manage the typing indicator throughout.
   */
  const respond = useCallback(
    async (text, history) => {
      setBusy(true);
      try {
        await respondViaApi(text, history);
      } catch {
        await respondLocal(text);
      } finally {
        setBusy(false);
      }
    },
    [respondViaApi, respondLocal]
  );

  const send = useCallback(
    (raw) => {
      const text = (raw ?? input).trim();
      if (!text || busy) return;
      // Snapshot prior turns for conversational context before adding this one.
      const history = messages
        .filter((m) => m.text)
        .map((m) => ({ role: m.role, text: m.text }));
      push(userMsg(text));
      setInput('');
      respond(text, history);
    },
    [input, busy, messages, push, respond]
  );

  return (
    <>
      {/* Launcher — fades in once scrolled past the hero on the home page */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        aria-hidden={hiddenOverHero}
        tabIndex={hiddenOverHero ? -1 : 0}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: hiddenOverHero ? 0.6 : 1,
          opacity: hiddenOverHero ? 0 : 1,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        style={{ pointerEvents: hiddenOverHero ? 'none' : 'auto' }}
        className="group fixed bottom-4 right-4 z-[60] inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10 shadow-glass ring-1 ring-white/15 backdrop-blur-xl sm:bottom-5 sm:right-5 sm:h-16 sm:w-16"
      >
        {/* Soft halo pulse behind the launcher */}
        {!open && (
          <span className="absolute inset-0 -z-10 rounded-full bg-primary/40 blur-md animate-ambient-pulse" />
        )}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="h-6 w-6 text-white" />
            </motion.span>
          ) : (
            <motion.span key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <BotAvatar className="h-8 w-8 text-white drop-shadow" animate />
            </motion.span>
          )}
        </AnimatePresence>
        {/* Online status dot */}
        {!open && (
          <span className="absolute right-1 top-1 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-background" />
          </span>
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-20 right-3 z-[70] flex h-[60vh] max-h-[460px] w-[min(320px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-white/10 bg-background/40 shadow-glass backdrop-blur-xl sm:bottom-24 sm:right-5 sm:h-[clamp(420px,70vh,560px)] sm:max-h-none sm:w-[min(370px,calc(100vw-2.5rem))] sm:bg-background/40"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-3">
              <div className="relative inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/25 bg-white/10 ring-1 ring-white/15 backdrop-blur-xl">
                <BotAvatar className="h-5 w-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
              </div>
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-content sm:text-sm">AI Image World</p>
                <p className="text-[10px] text-content-muted sm:text-[11px]">Prompt assistant · online</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-white/10 hover:text-content"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && !busy ? (
                <WelcomeIntro onChip={(c) => send(c)} />
              ) : (
                messages.map((m) => (
                  <MessageBubble key={m.id} msg={m} onChip={(c) => send(c)} />
                ))
              )}
              {busy && <TypingDots />}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="border-t border-white/10 bg-white/5 px-3 py-3"
            >
              <div className="flex items-end gap-2 rounded-[1.75rem] border border-white/10 bg-background/60 px-3 py-1.5 shadow-inner transition-all">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // Auto-grow up to ~4 lines, then scroll inside.
                    const el = e.target;
                    el.style.height = 'auto';
                    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Ask for a prompt or category…"
                  aria-label="Message the assistant"
                  className="max-h-28 min-w-0 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-[11.5px] leading-relaxed text-content placeholder:text-content-muted/60 focus:outline-none sm:text-[13px]"
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || busy}
                  aria-label="Send message"
                  whileTap={{ scale: 0.9 }}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-content-muted/50">
                <kbd className="font-sans">Enter</kbd> to send ·{' '}
                <kbd className="font-sans">Shift+Enter</kbd> for a new line
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export { Chatbot };
export default Chatbot;
