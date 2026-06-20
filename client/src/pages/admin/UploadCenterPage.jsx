import { useRef, useState } from 'react';
import { UploadCloud, Loader2, Plus, CheckCircle2 } from 'lucide-react';

import { Seo } from '@/components/common/Seo';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ImageFormModal } from '@/components/admin/ImageFormModal';
import { useUploadImage } from '@/hooks/useUpload';
import { useCategories } from '@/hooks/useCategories';

/**
 * UploadCenterPage — upload an image to Cloudinary (POST /upload/image),
 * preview it with its generated thumbnail, then save it to the library
 * (POST /images) via a prefilled form.
 */
export default function UploadCenterPage() {
  const upload = useUploadImage();
  const toast = useToast();
  const { data: catData } = useCategories({ active: true });
  const fileRef = useRef(null);

  const [result, setResult] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    try {
      const res = await upload.mutateAsync({ file });
      setResult(res.data);
      toast.success('Uploaded to Cloudinary');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <>
      <Seo title="Upload Center" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Upload Center</h1>
        <p className="mt-1 text-sm text-content-muted">
          Upload an image, generate a thumbnail, then add it to the library.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-surface/40 p-8 text-center"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {upload.isPending ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : (
            <UploadCloud className="h-10 w-10 text-content-muted" />
          )}
          <p className="mt-4 text-sm text-content-muted">
            Drag &amp; drop an image here, or
          </p>
          <Button className="mt-3" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
            Choose file
          </Button>
          <p className="mt-3 text-xs text-content-muted">JPG / PNG / WEBP · max 10MB</p>
        </div>

        {/* Preview */}
        <div className="rounded-2xl glass-panel p-5">
          <h2 className="mb-4 text-sm font-semibold text-content-muted">Preview</h2>
          {!result ? (
            <p className="py-12 text-center text-sm text-content-muted">
              Uploaded image details will appear here.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="h-5 w-5" /> Upload successful
              </div>
              <img
                src={result.thumbnailUrl || result.imageUrl}
                alt="Uploaded preview"
                className="w-full rounded-xl border border-white/10 object-contain"
              />
              <dl className="space-y-1 text-xs text-content-muted">
                <div className="flex justify-between gap-3">
                  <dt>Dimensions</dt>
                  <dd className="text-content">
                    {result.width && result.height ? `${result.width} × ${result.height}` : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Format</dt>
                  <dd className="text-content">{result.format?.toUpperCase()}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Public ID</dt>
                  <dd className="max-w-[60%] truncate text-content">{result.publicId}</dd>
                </div>
              </dl>
              <Button className="w-full" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" /> Save to Image Library
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Prefilled create form */}
      <ImageFormModal
        open={formOpen}
        image={result ? { imageUrl: result.imageUrl, thumbnailUrl: result.thumbnailUrl, publicId: result.publicId } : null}
        categories={catData?.data ?? []}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          setResult(null);
          toast.success('Saved to library');
        }}
      />
    </>
  );
}
