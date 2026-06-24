import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Hash, Folder, Image as ImageIcon } from 'lucide-react';

import { cn } from '@/utils/cn';
import { Input } from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchSuggestions } from '@/hooks/useSearch';

/**
 * SearchBar — debounced autocomplete + submit to the search page.
 */
function SearchBar({ className, autoFocus, placeholder = 'Search images, styles, prompts…' }) {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(value, 300);

  const { data } = useSearchSuggestions(debounced);
  const suggestions = data?.data;

  const submit = (q) => {
    const term = (q ?? value).trim();
    if (!term) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const rows = [
    ...(suggestions?.titles || []).map((t) => ({ type: 'title', label: t, Icon: ImageIcon })),
    ...(suggestions?.categories || []).map((c) => ({ type: 'category', label: c, Icon: Folder })),
    ...(suggestions?.tags || []).map((t) => ({ type: 'tag', label: t, Icon: Hash })),
  ];

  return (
    <div className={cn('relative w-full', className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        role="search"
      >
        <Input
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-label="Search"
          className="placeholder:text-xs"
          leftIcon={<Search className="h-5 w-5" />}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </form>

      <AnimatePresence>
        {open && rows.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 max-h-80 w-full overflow-auto rounded-2xl glass-panel p-2"
          >
            {rows.map((row, i) => (
              <li key={`${row.type}-${i}`}>
                <button
                  type="button"
                  onMouseDown={() => submit(row.label)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-content-muted transition-colors hover:bg-white/5 hover:text-content"
                >
                  <row.Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{row.label}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export { SearchBar };
