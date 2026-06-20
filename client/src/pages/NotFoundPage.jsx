import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

import { Seo } from '@/components/common/Seo';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';

/** NotFoundPage — 404 fallback. */
export default function NotFoundPage() {
  return (
    <>
      <Seo title="Page Not Found" />
      <EmptyState
        icon={Compass}
        title="Page not found"
        message="The page you're looking for doesn't exist or has moved."
        action={
          <Link to="/">
            <Button>Back to home</Button>
          </Link>
        }
      />
    </>
  );
}
