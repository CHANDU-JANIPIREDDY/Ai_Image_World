import { useEffect, useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useImageMutations } from '@/hooks/useImages';
import { useUploadImage } from '@/hooks/useUpload';

const EMPTY = {
  title: '',
  category: '',
  imageUrl: '',
  thumbnailUrl: '',
  publicId: '',
  prompt: '',
  negativePrompt: '',
  tags: '',
  sourceAiTool: '',
  featured: false,
  status: 'draft',
  scheduledAt: '',
  seoTitle: '',
  seoDescription: '',
};

const fieldClass =
  'w-full rounded-xl border border-white/10 bg-surface px-4 py-2 text-content placeholder:text-content-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40';

/**
 * ImageFormModal — create or edit an image (POST/PUT /images), with an inline
 * Cloudinary upload (POST /upload/image) that fills the image + thumbnail URLs.
 */
export function ImageFormModal({ open, onClose, image, categories = [], onSaved }) {
  // Edit only when an existing record (_id) is passed; a bare {imageUrl,…}
  // object means "prefilled create" (used by the Upload Center).
  const isEdit = Boolean(image?._id);
  const toast = useToast();
  const { create, update } = useImageMutations();
  const upload = useUploadImage();
  const fileRef = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      image
        ? {
            ...EMPTY,
            title: image.title || '',
            category: image.category?._id || image.category || '',
            imageUrl: image.imageUrl || '',
            thumbnailUrl: image.thumbnailUrl || '',
            publicId: image.publicId || '',
            prompt: image.prompt || '',
            negativePrompt: image.negativePrompt || '',
            tags: (image.tags || []).join(', '),
            sourceAiTool: image.sourceAiTool || '',
            featured: image.featured || false,
            status: image.status || 'draft',
            seoTitle: image.seoTitle || '',
            seoDescription: image.seoDescription || '',
          }
        : EMPTY
    );
  }, [open, image]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await upload.mutateAsync({ file });
      setForm((f) => ({
        ...f,
        imageUrl: res.data.imageUrl,
        thumbnailUrl: res.data.thumbnailUrl,
        publicId: res.data.publicId,
      }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const buildPayload = () => {
    const p = {
      title: form.title.trim(),
      category: form.category,
      imageUrl: form.imageUrl.trim(),
      prompt: form.prompt.trim(),
      status: form.status,
      featured: form.featured,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (form.thumbnailUrl.trim()) p.thumbnailUrl = form.thumbnailUrl.trim();
    if (form.publicId.trim()) p.publicId = form.publicId.trim();
    if (form.negativePrompt.trim()) p.negativePrompt = form.negativePrompt.trim();
    if (form.sourceAiTool.trim()) p.sourceAiTool = form.sourceAiTool.trim();
    if (form.seoTitle.trim()) p.seoTitle = form.seoTitle.trim();
    if (form.seoDescription.trim()) p.seoDescription = form.seoDescription.trim();
    if (form.status === 'scheduled' && form.scheduledAt) {
      p.scheduledAt = new Date(form.scheduledAt).toISOString();
    }
    return p;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = buildPayload();
      if (isEdit) {
        await update.mutateAsync({ id: image._id, payload });
        toast.success('Image updated');
      } else {
        await create.mutateAsync(payload);
        toast.success('Image created');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.errors?.[0]?.message || err.message || 'Save failed');
    }
  };

  const saving = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Image' : 'New Image'}
      className="max-w-2xl"
    >
      <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        {/* Upload + preview */}
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-surface">
            {form.thumbnailUrl || form.imageUrl ? (
              <img src={form.thumbnailUrl || form.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-content-muted">
                <Upload className="h-6 w-6" />
              </div>
            )}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={upload.isPending}
            >
              {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload image
            </Button>
            <p className="mt-1 text-xs text-content-muted">JPG / PNG / WEBP, max 10MB</p>
          </div>
        </div>

        <Input label="Title" value={form.title} onChange={set('title')} required />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content">Category</label>
            <select value={form.category} onChange={set('category')} required className={fieldClass}>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content">Status</label>
            <select value={form.status} onChange={set('status')} className={fieldClass}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        {form.status === 'scheduled' && (
          <Input
            label="Scheduled at"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={set('scheduledAt')}
          />
        )}

        <Input label="Image URL" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://…" required />
        <Input label="Thumbnail URL" value={form.thumbnailUrl} onChange={set('thumbnailUrl')} placeholder="https://…" />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-content">Prompt</label>
          <textarea value={form.prompt} onChange={set('prompt')} rows={3} required className={fieldClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-content">Negative prompt</label>
          <textarea value={form.negativePrompt} onChange={set('negativePrompt')} rows={2} className={fieldClass} />
        </div>

        <Input label="Tags (comma separated)" value={form.tags} onChange={set('tags')} placeholder="anime, 4k, portrait" />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Source AI tool" value={form.sourceAiTool} onChange={set('sourceAiTool')} placeholder="Midjourney" />
          <label className="flex items-end gap-2 pb-2.5 text-sm text-content">
            <input type="checkbox" checked={form.featured} onChange={set('featured')} className="h-4 w-4" />
            Featured
          </label>
        </div>

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
            {isEdit ? 'Save changes' : 'Create image'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
