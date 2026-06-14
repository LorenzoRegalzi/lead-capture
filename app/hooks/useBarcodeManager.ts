import { useState } from 'react';

type BarcodeItem = {
  barcode: string;
  quantity: number;
  storeName: string | null;
  storeNumber: string | null;
  photo_1: string;
  photo_2: string;
  photo_3: string;
  photo_4: string;
  delete_link: string;
};

export function useBarcodeManager() {
  const [barcodes, setBarcodes] = useState<BarcodeItem[]>([]);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [storeNumber, setStoreNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [photos, setPhotos] = useState<any>(null);
  const MAX_PHOTOS = 4;
  const [uploading, setUploading] = useState(false);
    const [showFinishProcess, setShowFinishProcess] = useState(false);

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
          delete_link: '',
          storeName,
          storeNumber,
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
          delete_link: '',
          storeName,
          storeNumber,
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

    const uploadedUrls: string[] = [];
    let submissionId = crypto.randomUUID();

    for (const ph of photos) {
    const formData = new FormData();
    formData.append('file', ph);
    formData.append('submissionId', submissionId);

    await fetch(`/api/upload?submissionId=${submissionId}`, {
        method: 'POST',
        body: formData,
    }).then(async (r) => {
        const data = await r.json();
        uploadedUrls.push(data.url);
    }).catch((err) => {
        console.error('Upload failed:', err);
        setError('Failed to save lead. Please try again.');
    });
    
    }
    await uploadGoogleSheet(uploadedUrls, submissionId);
  };

  const uploadGoogleSheet = async (photoUrls: string[] = [], submissionId: string) => {
    setShowLoadingOverlay(true);

    if (barcodes.length > 0) {
      barcodes[0].photo_1 = photoUrls[0] || '';
      barcodes[0].photo_2 = photoUrls[1] || '';
      barcodes[0].photo_3 = photoUrls[2] || '';
      barcodes[0].photo_4 = photoUrls[3] || '';
      barcodes[0].delete_link = `https://lead-capture-three.vercel.app/delete/${submissionId}`;
    }

    await fetch('/api/save-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeName,
        storeNumber,
        barcodes,
      }),
    }).then(() => {
      setShowLoadingOverlay(false);
      setShowFinishProcess(true);
    }).catch((err) => {
      console.error(err);
      setError('Failed to save lead. Please try again.');
      setShowLoadingOverlay(false);
    });
  };

  const deletePhoto = (index: number) => {
    setPhotos((prevPhotos:any) => {
      if (!prevPhotos) return null;
      return prevPhotos.filter((_:any, i:any) => i !== index);
    });
  };

  return {
    barcodes,
    storeName,
    storeNumber,
    setStoreName,
    setStoreNumber,
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
    showFinishProcess,
    setShowFinishProcess,
    deletePhoto,
  };
}

