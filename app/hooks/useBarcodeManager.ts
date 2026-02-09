import { useState } from 'react';

type BarcodeItem = {
  barcode: string;
  quantity: number;
  companyCode: string | null;
  photo_1: string;
  photo_2: string;
  photo_3: string;
  photo_4: string;
};

export function useBarcodeManager() {
  const [barcodes, setBarcodes] = useState<BarcodeItem[]>([]);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [photos, setPhotos] = useState<any>(null);
  const MAX_PHOTOS = 4;
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setBarcodes([]);
    setError(null);
  };

  const addBarcode = (code: string) => {
    setBarcodes((prev) => {
      const idx = prev.findIndex((b) => b.barcode === code);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        {
          barcode: code,
          quantity: 1,
          photo_1: '',
          photo_2: '',
          photo_3: '',
          photo_4: '',
          companyCode,
        },
      ];
    });
  };

  const addManualBarcode = (manualBarcode: string, manualQuantity: number) => {
    if (!manualBarcode.trim() || manualQuantity < 1) return;
    setBarcodes((prev) => {
      const idx = prev.findIndex((b) => b.barcode === manualBarcode.trim());
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].quantity += manualQuantity;
        return updated;
      }
      return [
        ...prev,
        {
          barcode: manualBarcode.trim(),
          quantity: manualQuantity,
          photo_1: '',
          photo_2: '',
          photo_3: '',
          photo_4: '',
          companyCode,
        },
      ];
    });
  };

  const increment = (idx: number) => {
    setBarcodes((prev) => {
      const updated = [...prev];
      updated[idx].quantity += 1;
      return updated;
    });
  };

  const decrement = (idx: number) => {
    setBarcodes((prev) => {
      const updated = [...prev];
      if (updated[idx].quantity > 1) {
        updated[idx].quantity -= 1;
      } else {
        updated.splice(idx, 1);
      }
      return updated;
    });
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setPhotos((prev: any) => {
      if (!prev) return files.slice(0, MAX_PHOTOS);
      const combined = [...prev, ...files];
      return combined.slice(0, MAX_PHOTOS);
    });
  };

  const handleUpload = async () => {
    if (!photos?.length) return;

    setUploading(true);
    setShowLoadingOverlay(true);

    try {
      const uploadedUrls: string[] = [];

      for (const ph of photos) {
        const formData = new FormData();
        formData.append('file', ph);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        uploadedUrls.push(data.url);
      }

      await uploadGoogleSheet(uploadedUrls);
    } catch (err) {
      console.error(err);
      setShowLoadingOverlay(false);
    }
  };

  const uploadGoogleSheet = async (photoUrls: string[] = []) => {
    setShowLoadingOverlay(true);

    if (barcodes.length > 0) {
      barcodes[0].photo_1 = photoUrls[0] || '';
      barcodes[0].photo_2 = photoUrls[1] || '';
      barcodes[0].photo_3 = photoUrls[2] || '';
      barcodes[0].photo_4 = photoUrls[3] || '';
    }

    await fetch('/api/save-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyCode,
        barcodes,
      }),
    });

    window.location.reload();
  };

  return {
    barcodes,
    companyCode,
    setCompanyCode,
    error,
    setError,
    showLoadingOverlay,
    photos,
    uploading,
    reset,
    addBarcode,
    addManualBarcode,
    increment,
    decrement,
    handlePhoto,
    handleUpload,
  };
}