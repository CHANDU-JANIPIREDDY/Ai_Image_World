import { useEffect, useState } from 'react';

/**
 * useDebounce — return a debounced copy of `value` that updates after `delay`ms
 * of no changes. Used by SearchBar to throttle suggestion requests.
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
