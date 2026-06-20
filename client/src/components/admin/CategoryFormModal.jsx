import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useCategoryMutations } from '@/hooks/useCategories';

const EMPTY = {
  name: '',
  description: '',
  thumbnailUrl: '',
  sortOrder: 0,
  isActive: true,
  seoTitle: '',
  seoDescription: '',
};

/**
 * CategoryFormModal — create or edit a category (POST/PUT /categories).
 */
export function CategoryFormModal({ open, onClose, category, onSaved }) {
  const isEdit = Boolean(category);
  const toast = useToast();
  const { create, update } = useCategoryMutations();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      setForm(
        category
          ? {
              name: category.name || '',
              description: category.description || '',
              thumbnailUrl: category.thumbnailUrl || '',
              sortOrder: category.sortOrder ?? 0,
              isActive: category.isActive ?? true,
              seoTitle: category.seoTitle || '',
              seoDescription: category.seoDescription || '',
            }
          : EMPTY
      );
    }
  }, [open, category]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const buildPayload = () => {
    const p = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
      seoTitle: form.seoTitle.trim() || undefined,
      seoDescription: form.seoDescription.trim() || undefined,
    };
    if (form.thumbnailUrl.trim()) p.thumbnailUrl = form.thumbnailUrl.trim();
    return p;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = buildPayload();
      if (isEdit) {
        await update.mutateAsync({ id: category._id, payload });
        toast.success('Category updated');
      } else {
        await create.mutateAsync(payload);
        toast.success('Category created');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.errors?.[0]?.message || err.message || 'Save failed');
    }
  };

  const saving = create.isPending || update.isPending;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Category' : 'New Category'}>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Name" value={form.name} onChange={set('name')} required />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-content">Description</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-surface px-4 py-2 text-content placeholder:text-content-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <Input label="Thumbnail URL" value={form.thumbnailUrl} onChange={set('thumbnailUrl')} placeholder="https://…" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Sort order" type="number" value={form.sortOrder} onChange={set('sortOrder')} />
          <label className="flex items-end gap-2 pb-2.5 text-sm text-content">
            <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="h-4 w-4" />
            Active
          </label>
        </div>
        <Input label="SEO title" value={form.seoTitle} onChange={set('seoTitle')} />
        <Input label="SEO description" value={form.seoDescription} onChange={set('seoDescription')} />

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Save changes' : 'Create category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
