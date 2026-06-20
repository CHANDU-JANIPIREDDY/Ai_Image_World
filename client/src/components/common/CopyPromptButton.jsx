import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useCopyPrompt } from '@/hooks/useImages';
import { trackPromptCopy } from '@/utils/analytics';

/**
 * CopyPromptButton — copy a prompt to the clipboard, increment the server-side
 * copy count, and surface a success toast with a transient "Copied!" state.
 */
function CopyPromptButton({ prompt, imageId, className }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const { mutate: recordCopy } = useCopyPrompt();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt || '');
      setCopied(true);
      toast.success('Prompt copied to clipboard');
      if (imageId) {
        recordCopy(imageId); // server-side copy count (POST /images/:id/copy)
        trackPromptCopy(imageId); // analytics event (prompt_copy)
      }
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — please copy manually');
    }
  };

  return (
    <Button onClick={handleCopy} className={className} aria-label="Copy prompt">
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="done"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-2"
          >
            <Check className="h-4 w-4" /> Copied!
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-2"
          >
            <Copy className="h-4 w-4" /> Copy Prompt
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}

export { CopyPromptButton };
