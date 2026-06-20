import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

import { Seo } from '@/components/common/Seo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorBlock } from '@/components/common/ErrorBlock';
import { CategoryFormModal } from '@/components/admin/CategoryFormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useCategories, useCategoryMutations } from '@/hooks/useCategories';
import { formatCount } from '@/utils/format';

export default function AdminCategoriesPage() {
  const { data, isLoading, isError, refetch } = useCategories({ includeCounts: true });
  const { remove } = useCategoryMutations();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // category | {} (new) | null
  const [deleting, setDeleting] = useState(null);

  const categories = data?.data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q) || c.slug.includes(q));
  }, [categories, query]);

  const confirmDelete = async () => {
    try {
      // force=true so categories that still hold images can be removed (images reassigned).
      await remove.mutateAsync({ id: deleting._id, force: true });
      toast.success('Category deleted');
      setDeleting(null);
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  return (
    <>
      <Seo title="Manage Categories" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="mt-1 text-sm text-content-muted">{formatCount(categories.length)} total</p>
        </div>
        <Button onClick={() => setEditing({})}>
          <Plus className="h-4 w-4" /> New Category
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories…"
          className="h-10 w-full rounded-xl border border-white/10 bg-surface pl-9 pr-3 text-content placeholder:text-content-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <ErrorBlock message="Couldn't load categories." onRetry={refetch} />
      ) : (
        <div className="overflow-hidden rounded-2xl glass-panel">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-content-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Slug</th>
                <th className="px-4 py-3 font-medium">Images</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-surface">
                        {c.thumbnailUrl && (
                          <img src={c.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <span className="font-medium text-content">{c.name}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-content-muted sm:table-cell">{c.slug}</td>
                  <td className="px-4 py-3 text-content-muted">{formatCount(c.imageCount ?? 0)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.isActive ? 'published' : 'default'}>
                      {c.isActive ? 'Active' : 'Hidden'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(c)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(c)} aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-content-muted">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <CategoryFormModal
        open={Boolean(editing)}
        category={editing?._id ? editing : null}
        onClose={() => setEditing(null)}
        onSaved={refetch}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete category"
        message={`Delete “${deleting?.name}”? Images in it will be reassigned to “Uncategorized”.`}
        confirmText="Delete"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
