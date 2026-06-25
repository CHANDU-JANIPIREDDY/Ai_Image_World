import { useState } from 'react';
import { Plus, Pencil, Trash2, Star, Eye, Copy } from 'lucide-react';

import { Seo } from '@/components/common/Seo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { ErrorBlock } from '@/components/common/ErrorBlock';
import { ImageFormModal } from '@/components/admin/ImageFormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useAdminImages, useImageMutations } from '@/hooks/useImages';
import { useCategories } from '@/hooks/useCategories';
import { formatCount } from '@/utils/format';
import { cn } from '@/utils/cn';

const fieldClass =
  'h-10 rounded-xl border border-white/10 bg-surface px-3 text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40';

export default function AdminImagesPage() {
  const [filters, setFilters] = useState({ status: '', category: '', sort: 'latest', page: 1 });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const query = useAdminImages({
    sort: filters.sort,
    page: filters.page,
    limit: 20,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.category ? { category: filters.category } : {}),
  });
  const { data: catData } = useCategories({ active: true });
  const { update, remove } = useImageMutations();
  const toast = useToast();

  const images = query.data?.data ?? [];
  const meta = query.data?.meta;
  const categories = catData?.data ?? [];

  const patch = (p) => setFilters((f) => ({ ...f, ...p }));

  const toggleFeatured = async (img) => {
    try {
      await update.mutateAsync({ id: img._id, payload: { featured: !img.featured } });
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  const setStatus = async (img, status) => {
    try {
      await update.mutateAsync({ id: img._id, payload: { status } });
      toast.success(`Marked ${status}`);
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync(deleting._id);
      toast.success('Image deleted');
      setDeleting(null);
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  return (
    <>
      <Seo title="Manage Images" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Images</h1>
          <p className="mt-1 text-sm text-content-muted">{formatCount(meta?.total ?? 0)} total</p>
        </div>
        <Button onClick={() => setEditing({})}>
          <Plus className="h-4 w-4" /> New Image
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select value={filters.status} onChange={(e) => patch({ status: e.target.value, page: 1 })} className={fieldClass}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
        <select value={filters.category} onChange={(e) => patch({ category: e.target.value, page: 1 })} className={fieldClass}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={filters.sort} onChange={(e) => patch({ sort: e.target.value, page: 1 })} className={fieldClass}>
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
          <option value="popular">Most viewed</option>
          <option value="most_copied">Most copied</option>
          <option value="most_liked">Most liked</option>
        </select>
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : query.isError ? (
        <ErrorBlock message="Couldn't load images." onRetry={query.refetch} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl glass-panel">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-white/10 text-left text-content-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Image</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Views</th>
                  <th className="px-4 py-3 font-medium">Copies</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {images.map((img) => (
                  <tr key={img._id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={img.thumbnailUrl || img.imageUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                        <span className="line-clamp-1 max-w-[220px] font-medium text-content">
                          {img.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-content-muted">
                      {img.category?.name || img.categoryName || '—'}
                    </td>
                    <td className="px-4 py-3 text-content-muted">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> {formatCount(img.views)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-content-muted">
                      <span className="inline-flex items-center gap-1">
                        <Copy className="h-3.5 w-3.5" /> {formatCount(img.promptCopyCount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setStatus(img, img.status === 'published' ? 'draft' : 'published')}
                        title="Toggle published/draft"
                      >
                        <Badge variant={img.status}>{img.status}</Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFeatured(img)}
                          aria-label="Toggle featured"
                        >
                          <Star className={cn('h-4 w-4', img.featured ? 'fill-amber-400 text-amber-400' : 'text-content-muted')} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditing(img)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(img)} aria-label="Delete">
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {images.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-content-muted">
                      No images found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            className="mt-8"
            page={meta?.page || filters.page}
            totalPages={meta?.totalPages || 0}
            onPageChange={(p) => patch({ page: p })}
          />
        </>
      )}

      <ImageFormModal
        open={Boolean(editing)}
        image={editing?._id ? editing : null}
        categories={categories}
        onClose={() => setEditing(null)}
        onSaved={query.refetch}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete image"
        message={`Permanently delete “${deleting?.title}”?`}
        confirmText="Delete"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
