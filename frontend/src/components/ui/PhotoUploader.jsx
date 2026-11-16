import React, { useCallback, useRef, useState } from 'react';
import { Camera, ImagePlus, Link2, Loader2, Star, Trash2, ChevronLeft, ChevronRight, AlertCircle, RotateCw, UploadCloud } from 'lucide-react';
import api from '../../services/api';
import { ACCEPTED_TYPES, MAX_UPLOAD_BYTES, checkImageUrl, prepareImage } from '../../lib/image';
import { Button } from './Button';

let seq = 0;
const nextId = () => `p${Date.now()}_${(seq += 1)}`;

/**
 * Photo picker for listings.
 *  - Upload from computer (click or drag and drop) or phone (camera / gallery)
 *  - Or paste a direct image link
 * `photos` items: { id, value, preview, status: 'uploading'|'done'|'error', progress, error, file }
 * `value` is what is sent to the API: an uploaded storage path or an https URL.
 * `setPhotos` must accept an updater function (like React's setState).
 */
export function PhotoUploader({ photos, setPhotos, max = 6, error }) {
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState('');
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const [checkingLink, setCheckingLink] = useState(false);

  const update = useCallback((id, patch) => setPhotos((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p))), [setPhotos]);

  const upload = useCallback(
    async (id, original) => {
      update(id, { status: 'uploading', progress: 0, error: '' });
      try {
        const file = await prepareImage(original);
        if (file.size > MAX_UPLOAD_BYTES) throw new Error('This photo is larger than 5 MB.');
        const form = new FormData();
        form.append('image', file);
        const res = await api.post('/uploads/images', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
          onUploadProgress: (e) => e.total && update(id, { progress: Math.round((e.loaded / e.total) * 100) }),
        });
        update(id, { status: 'done', value: res.data.data.path, progress: 100, file: undefined });
      } catch (err) {
        const msg =
          err.response?.data?.errors?.image?.[0] ||
          err.response?.data?.message ||
          err.message ||
          'Upload failed.';
        update(id, { status: 'error', error: msg });
      }
    },
    [update],
  );

  const addFiles = (fileList) => {
    setNotice('');
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const room = max - photos.length;
    if (room <= 0) {
      setNotice(`You can add up to ${max} photos.`);
      return;
    }
    const skipped = [];
    const accepted = [];
    files.forEach((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) skipped.push(`${f.name} (use JPG, PNG or WebP)`);
      else accepted.push(f);
    });
    if (accepted.length > room) setNotice(`Only ${room} more photo${room === 1 ? '' : 's'} can be added. Extra photos were skipped.`);
    if (skipped.length) setNotice(`Skipped: ${skipped.join(', ')}`);

    const items = accepted.slice(0, room).map((file) => ({
      id: nextId(),
      value: '',
      preview: URL.createObjectURL(file),
      status: 'uploading',
      progress: 0,
      error: '',
      file,
    }));
    setPhotos((list) => [...list, ...items]);
    items.forEach((it) => upload(it.id, it.file));
  };

  const addLink = async () => {
    const url = link.trim();
    setLinkError('');
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      setLinkError('Enter a full link starting with https://');
      return;
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) return setLinkError('Enter a full link starting with https://');
    if (url.length > 255) return setLinkError('That link is too long (max 255 characters).');
    if (photos.some((p) => p.value === url)) return setLinkError('You have already added this photo.');
    if (photos.length >= max) return setLinkError(`You can add up to ${max} photos.`);

    setCheckingLink(true);
    const ok = await checkImageUrl(url);
    setCheckingLink(false);
    if (!ok) {
      setLinkError(
        "This link doesn't open a photo directly (share links from Google Photos or Facebook usually don't). Upload the photo from your device instead.",
      );
      return;
    }
    setPhotos((list) => [...list, { id: nextId(), value: url, preview: url, status: 'done', progress: 100, error: '' }]);
    setLink('');
  };

  const remove = (id) =>
    setPhotos((list) => {
      const item = list.find((p) => p.id === id);
      if (item?.preview?.startsWith('blob:')) URL.revokeObjectURL(item.preview);
      return list.filter((p) => p.id !== id);
    });

  const move = (from, to) =>
    setPhotos((list) => {
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });

  const full = photos.length >= max;

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={full ? -1 : 0}
        aria-disabled={full}
        aria-label="Add photos"
        onClick={() => !full && fileRef.current?.click()}
        onKeyDown={(e) => {
          if (!full && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!full) addFiles(e.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:p-8 ${
          dragging ? 'border-primary bg-primary/5' : error ? 'border-red-300 bg-red-50/40' : 'border-zinc-300 bg-zinc-50/60'
        } ${full ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary/60 hover:bg-primary/5'}`}
      >
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-zinc-200">
          <UploadCloud size={28} aria-hidden="true" />
        </span>
        <p className="mt-3 text-base font-bold text-ink">Add photos of your pet or item</p>
        <p className="mt-1 text-sm text-muted">
          <span className="hidden sm:inline">Click anywhere here or drag and drop photos. </span>
          JPG, PNG or WebP, up to 5 MB each. Large photos are resized automatically.
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              fileRef.current?.click();
            }}
            disabled={full}
            iconLeft={<ImagePlus size={18} />}
          >
            <span className="sm:hidden">Choose from gallery</span>
            <span className="hidden sm:inline">Choose photos</span>
          </Button>
          <Button
            variant="outline"
            className="sm:hidden"
            onClick={(e) => {
              e.stopPropagation();
              cameraRef.current?.click();
            }}
            disabled={full}
            iconLeft={<Camera size={18} />}
          >
            Take a photo
          </Button>
        </div>
        <input
          ref={fileRef}
          onClick={(e) => e.stopPropagation()}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={cameraRef}
          onClick={(e) => e.stopPropagation()}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <p className={`text-xs ${error || notice ? 'font-medium text-red-600' : 'text-muted'}`} role={error || notice ? 'alert' : undefined}>
        {error || notice || `${photos.length}/${max} photos added. The first photo is the cover.`}
      </p>

      {/* Thumbnails */}
      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <li key={p.id} className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              <div className="relative aspect-[4/3] bg-zinc-100">
                <img src={p.preview} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && p.status !== 'error' && (
                  <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white shadow">Cover</span>
                )}
                {p.status === 'uploading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/55 text-white">
                    <Loader2 size={22} className="animate-spin" aria-hidden="true" />
                    <span className="text-xs font-semibold">Uploading {p.progress || 0}%</span>
                    <span className="mx-6 h-1.5 w-3/4 overflow-hidden rounded-full bg-white/25">
                      <span className="block h-full rounded-full bg-primary transition-all" style={{ width: `${p.progress || 0}%` }} />
                    </span>
                  </div>
                )}
                {p.status === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-900/70 p-3 text-center text-white">
                    <AlertCircle size={20} aria-hidden="true" />
                    <span className="line-clamp-3 text-xs font-medium">{p.error}</span>
                    {p.file && (
                      <button
                        type="button"
                        onClick={() => upload(p.id, p.file)}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <RotateCw size={12} aria-hidden="true" /> Retry
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5">
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    aria-label={`Move photo ${i + 1} left`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-zinc-100 hover:text-ink disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={i === photos.length - 1}
                    aria-label={`Move photo ${i + 1} right`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-zinc-100 hover:text-ink disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <ChevronRight size={17} />
                  </button>
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => move(i, 0)}
                      aria-label={`Use photo ${i + 1} as cover`}
                      className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-amber-50 hover:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Star size={17} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Paste a link instead */}
      <details className="group rounded-xl border border-border bg-white">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <Link2 size={16} className="text-muted" aria-hidden="true" />
          Or add a photo by link
          <ChevronRight size={16} className="ml-auto text-muted transition-transform group-open:rotate-90" aria-hidden="true" />
        </summary>
        <div className="border-t border-border p-4">
          <label htmlFor="photo-link" className="text-sm font-semibold text-ink">
            Direct image link
          </label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <input
              id="photo-link"
              type="url"
              inputMode="url"
              placeholder="https://example.com/photo.jpg"
              value={link}
              disabled={full}
              onChange={(e) => {
                setLink(e.target.value);
                if (linkError) setLinkError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addLink();
                }
              }}
              aria-invalid={!!linkError}
              aria-describedby="photo-link-help"
              className={`min-w-0 flex-1 rounded-lg border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-zinc-50 ${
                linkError ? 'border-red-400' : 'border-border'
              }`}
            />
            <Button variant="outline" onClick={addLink} loading={checkingLink} disabled={full}>
              Add link
            </Button>
          </div>
          <p id="photo-link-help" className={`mt-1.5 text-xs ${linkError ? 'font-medium text-red-600' : 'text-muted'}`}>
            {linkError || 'The link must open the image itself (ending in .jpg, .png or .webp). Share links usually do not work.'}
          </p>
        </div>
      </details>
    </div>
  );
}

export default PhotoUploader;
