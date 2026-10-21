export type Store = { name: string; number: string };
export type BarcodeEntry = { barcode: string; quantity: number };

// Sent along with every lead: the Apps Script writes the date as-is and uses the id to skip duplicates
export type LeadMeta = { submissionId: string; submittedAt: string };

// Shape expected by the Apps Script: photos are attached to the first barcode row only.
export function buildPayload(store: Store, barcodes: BarcodeEntry[], photoUrls: string[], meta: LeadMeta) {
  return {
    submissionId: meta.submissionId,
    submittedAt: meta.submittedAt,
    storeName: store.name,
    storeNumber: store.number,
    barcodes: barcodes.map((b, i) => ({
      barcode: b.barcode,
      quantity: b.quantity,
      storeName: store.name,
      storeNumber: store.number,
      photo_1: i === 0 ? photoUrls[0] ?? '' : '',
      photo_2: i === 0 ? photoUrls[1] ?? '' : '',
      photo_3: i === 0 ? photoUrls[2] ?? '' : '',
      photo_4: i === 0 ? photoUrls[3] ?? '' : '',
      delete_link: '',
    })),
  };
}

export async function uploadPhoto(photo: File, submissionId: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', photo);

  const r = await fetch(`/api/upload?submissionId=${submissionId}`, {
    method: 'POST',
    body: formData,
  });
  if (!r.ok) throw new Error(`Upload failed: ${r.status}`);

  const data = await r.json();
  return data.url;
}

export async function saveLead(store: Store, barcodes: BarcodeEntry[], photoUrls: string[], meta: LeadMeta) {
  const r = await fetch('/api/save-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildPayload(store, barcodes, photoUrls, meta)),
  });
  if (!r.ok) throw new Error(`Server error: ${r.status}`);
}
