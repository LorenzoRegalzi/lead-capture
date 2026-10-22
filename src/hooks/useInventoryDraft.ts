import { useEffect, useState } from 'react';
import { compressImage } from '@/src/lib/compressImage';
import { t } from '@/src/lib/strings';
import { loadHistory, saveHistoryEntry } from '@/src/lib/history';
import { saveInventory, uploadPhoto, type BarcodeEntry, type Store } from '@/src/lib/inventory';

export type { BarcodeEntry, Store };

export const MAX_PHOTOS = 4;
const DRAFT_KEY = 'lead-capture:draft:v2';

// id = submissionId, also the id of the history entry for this send
export type SubmitResult = { ok: true; id: string } | { ok: false; id: string; error: string };

type Draft = {
  store: Store | null;
  barcodes: BarcodeEntry[];
  submissionId: string;
};

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (err) {
    console.error('Failed to save draft:', err);
  }
}

export function useInventoryDraft() {
  const [store, setStore] = useState<Store | null>(null);
  const [barcodes, setBarcodes] = useState<BarcodeEntry[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submissionId, setSubmissionId] = useState('');
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore the saved draft (e.g. the browser killed the tab while the camera was open)
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setStore(draft.store);
      setBarcodes(draft.barcodes ?? []);
    }
    setSubmissionId(draft?.submissionId || crypto.randomUUID());
    setHydrated(true);
  }, []);

  // Save the draft on every change, so nothing is lost until the inventory is saved successfully
  useEffect(() => {
    if (!hydrated) return;
    saveDraft({ store, barcodes, submissionId });
  }, [hydrated, store, barcodes, submissionId]);

  const reset = () => {
    setStore(null);
    setBarcodes([]);
    setPhotos([]);
    setSubmissionId(crypto.randomUUID());
  };

  // Adding an existing barcode bumps its quantity and moves it to the end (shown as latest)
  const addBarcode = (code: string, quantity = 1) => {
    const barcode = code.trim();
    if (!barcode || quantity < 1) return;

    setBarcodes((prev) => {
      const existing = prev.find((b) => b.barcode === barcode);
      const others = prev.filter((b) => b.barcode !== barcode);
      return [...others, { barcode, quantity: (existing?.quantity ?? 0) + quantity }];
    });
  };

  const changeQuantity = (barcode: string, delta: number) => {
    setBarcodes((prev) =>
      prev
        .map((b) => (b.barcode === barcode ? { ...b, quantity: b.quantity + delta } : b))
        .filter((b) => b.quantity > 0)
    );
  };

  const addPhotos = async (files: File[]) => {
    const room = MAX_PHOTOS - photos.length;
    if (!files.length || room <= 0) return;

    setProcessingPhotos(true);
    try {
      // one at a time to avoid exhausting the phone's memory
      const compressed: File[] = [];
      for (const file of files.slice(0, room)) {
        compressed.push(await compressImage(file));
      }
      setPhotos((prev) => [...prev, ...compressed].slice(0, MAX_PHOTOS));
    } finally {
      setProcessingPhotos(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (): Promise<SubmitResult> => {
    if (!store) return { ok: false, id: submissionId, error: t.errors.missingStore };

    const photoUrls: string[] = [];
    // a retry keeps the date of the first attempt, so the Sheet and the history agree
    const createdAt =
      loadHistory().find((e) => e.id === submissionId)?.createdAt ?? new Date().toISOString();
    const entry = {
      id: submissionId,
      createdAt,
      store,
      barcodes,
      photoUrls,
    };
    saveHistoryEntry({ ...entry, status: 'pending' });

    try {
      for (const photo of photos) {
        photoUrls.push(await uploadPhoto(photo, submissionId));
      }
    } catch (err) {
      console.error(err);
      saveHistoryEntry({ ...entry, status: 'failed', error: t.errors.historyPhotoUpload });
      return { ok: false, id: submissionId, error: t.errors.photoUpload };
    }

    try {
      await saveInventory(store, barcodes, photoUrls, { submissionId, submittedAt: createdAt });
    } catch (err) {
      console.error(err);
      saveHistoryEntry({ ...entry, status: 'failed', error: t.errors.historySave });
      return { ok: false, id: submissionId, error: t.errors.saveInventory };
    }

    // the caller resets the draft once it has moved on (see the /done page)
    saveHistoryEntry({ ...entry, status: 'sent' });
    return { ok: true, id: submissionId };
  };

  return {
    hydrated,
    store,
    setStore,
    barcodes,
    addBarcode,
    changeQuantity,
    photos,
    processingPhotos,
    addPhotos,
    removePhoto,
    submit,
    reset,
  };
}
