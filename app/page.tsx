"use client";

import { useState, useRef, useEffect } from "react";
import QrScanner from "@/components/QrScanner";
import CompanyCodeInput from "@/components/CompanyCodeInput";
import Loader from "@/components/Loader";
import ScanOverlay from "@/components/ScanOverlay";

type BarcodeItem = {
  barcode: string;
  quantity: number;
  companyCode: string | null;
  photo_1: string;
  photo_2: string;
  photo_3: string;
  photo_4: string;
};

export default function Home() {
  const [barcodes, setBarcodes] = useState<BarcodeItem[]>([
    { barcode: "123456789012", quantity: 2, photo_1: "", photo_2: "", photo_3: "", photo_4: "",companyCode: '123' },
    { barcode: "34353434", quantity: 2, photo_1: "", photo_2: "", photo_3: "", photo_4: "",companyCode: '123' },
    // ...altri dati di test...
  ]);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [photos, setPhotos] = useState<any>(null);
  const MAX_PHOTOS = 4;
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<File | null>(null);

  // Sezioni
  const [showTakePhoto, setShowTakePhoto] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [manualQuantity, setManualQuantity] = useState(1);
  const [showScanOverlay, setShowScanOverlay] = useState(false);


  function reset() {
    setBarcodes([]);
    setError(null);
  }


  function addBarcode(code: string) {
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
          photo_1: "",
          photo_2: "",
          photo_3: "",
          photo_4: "", 
          companyCode 
        },
      ];
    });
  }

  function addManualBarcode() {
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
          photo_1: "",
          photo_2: "",
          photo_3: "",
          photo_4: "",
          companyCode,
        },
      ];
    });
    setManualBarcode("");
    setManualQuantity(1);
    setShowAddManual(false);
  }

  function increment(idx: number) {
    setBarcodes((prev) => {
      const updated = [...prev];
      updated[idx].quantity += 1;
      return updated;
    });
  }

  function decrement(idx: number) {
    setBarcodes((prev) => {
      const updated = [...prev];
      if (updated[idx].quantity > 1) {
        updated[idx].quantity -= 1;
      } else {
        updated.splice(idx, 1);
      }
      return updated;
    });
  }

  function handleScan(code: string) {
    addBarcode(code);
    setShowScanOverlay(true);
  }


  const removePhoto = (index: number) => () => {
    setPhotos((prev: any) => {
      if (!prev) return null;
      const updated = [...prev];
      updated.splice(index, 1);
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
    if (!photos.length) return;

    setUploading(true);
    setShowLoadingOverlay(true);

    try {
      const uploadedUrls: string[] = [];

      for (const ph of photos) {
        const formData = new FormData();
        formData.append("file", ph);

        const res = await fetch("/api/upload", {
          method: "POST",
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


async function uploadGoogleSheet(photoUrls: string[] = []) {
  setShowLoadingOverlay(true);
  
  barcodes[0].photo_1 = photoUrls[0] || "";
  barcodes[0].photo_2 = photoUrls[1] || "";
  barcodes[0].photo_3 = photoUrls[2] || "";
  barcodes[0].photo_4 = photoUrls[3] || "";

  await fetch("/api/save-lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyCode,
      barcodes,
    }),
  });

  window.location.reload();
}



    if (showLoadingOverlay) {
      return (
        <Loader/>
      );
    }
  
     if(showScanOverlay) {
      return (
      <ScanOverlay setShowScanOverlay={setShowScanOverlay}/>
    )}

  // Sezione submit
  if (showTakePhoto) {
    return (
      <main className="h-[100dvh] w-screen flex flex-col bg-white items-center justify-center">
         <h2 className="font-semibold mb-4 text-blue-700">Please photograph the display</h2>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {photos && (
           <div className="grid grid-cols-2 gap-4">
            {photos.map((p: any, i: number) => (
              <div key={i} className="flex flex-col gap-2">
                
                <img
                  src={URL.createObjectURL(p)}
                  className="w-full h-40 object-cover rounded border"
                />

                <button
                  className="bg-red-600 text-white px-3 py-2 rounded w-full"
                  onClick={() => removePhoto(i)}
                  disabled={uploading}
                >
                  Delete
                </button>

              </div>
            ))}
          </div>

          )}
          <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer text-center">
            Take photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              disabled={photos && photos.length >= MAX_PHOTOS}
              multiple
              onChange={handlePhoto}
              style={{ display: "none" }}
            />
          </label>
          {photos && <button
            className="bg-green-600 text-white px-4 py-2 rounded w-full"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? "Send..." : "Send photo"}
          </button>}
          <button
            className="bg-gray-300 text-black px-4 py-2 rounded w-full"
            onClick={() => {
              uploadGoogleSheet();
            }}
          >
            Skip photo and submit
          </button>
        </div>
      </main>
    );
  }

  // Sezione add manual
  if (showAddManual) {
    return (
      <main className="h-[100dvh] w-screen flex flex-col bg-white items-center justify-center">
        <div className="max-w-sm w-full bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <h2 className="font-semibold mb-4 text-blue-700">Add barcode manually</h2>
          <input
            type="text"
            placeholder="Barcode"
            value={manualBarcode}
            onChange={e => setManualBarcode(e.target.value)}
            className="w-full mb-2 p-2 border rounded text-black"
          />
          <input
            type="number"
            min={1}
            placeholder="Quantity"
            value={manualQuantity}
            onChange={e => setManualQuantity(Number(e.target.value))}
            className="w-full mb-4 p-2 border rounded text-black"
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded w-full mb-2"
            onClick={addManualBarcode}
            disabled={!manualBarcode.trim() || manualQuantity < 1}
          >
            Add
          </button>
          <button
            className="bg-gray-300 text-black px-4 py-2 rounded w-full"
            onClick={() => setShowAddManual(false)}
          >
            Cancel
          </button>
        </div>
      </main>
    );
  }

  {previewPhoto && (
  <div
    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
    onClick={() => setPreviewPhoto(null)}
  >
    <img
      src={URL.createObjectURL(previewPhoto)}
      className="max-w-full max-h-full object-contain"
    />

    {/* CHIUDI */}
    <button
      onClick={() => setPreviewPhoto(null)}
      className="absolute top-4 right-4 text-white text-3xl"
    >
      ✕
    </button>
  </div>
)}

    if(error) {
      return (
        <div className="text-red-600 text-center mt-4">
          {error}
          <button
            onClick={reset}
            className="block mt-4 underline"
          >
            Try again
          </button>
        </div>
      )
    }

   

  return (
    <main className="h-[100dvh] w-screen flex flex-col bg-white">
      {companyCode == null && (
        <div className="flex-1 flex items-center justify-center p-4">
          <CompanyCodeInput
            onSubmit={(code) => {
              setCompanyCode(code);
            }}
          />
        </div>
      )}

      {companyCode !== null && (
        <div className="w-full flex flex-col justify-center h-[100vh]">
          <div className="flex items-center justify-center w-full">
            <QrScanner onScan={handleScan} />
          </div>
          <div
            className="w-full bg-gray-50 border-t border-gray-200 p-4 overflow-y-auto flex-1 flex flex-col"
          >
            <h2 className="font-semibold mb-2 text-blue-700 flex justify-between items-center">
              <span>Company code: {companyCode}</span>
              <span className="text-base text-black font-normal">
                Total: {barcodes.reduce((acc, cur) => acc + cur.quantity, 0)}
              </span>
            </h2>
            <ul className="flex-1">
              {barcodes.map((item, idx) => (
                <li
                  key={item.barcode + idx}
                  className="flex justify-between items-center py-1 text-black"
                  style={{ height: "60px" }}
                >
                  <span className="font-mono">{item.barcode}</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold transition hover:bg-blue-700 active:bg-blue-800"
                      onClick={() => increment(idx)}
                      aria-label="Increment"
                    >
                      +
                    </button>
                    <span className="text-lg font-semibold">x{item.quantity}</span>
                    <button
                      className="bg-gray-300 text-black rounded-full w-10 h-20 flex items-center justify-center text-2xl font-bold transition hover:bg-gray-400 active:bg-gray-500"
                      onClick={() => decrement(idx)}
                      aria-label="Decrement"
                    >
                      −
                    </button>
                  </div>
                </li>
              ))}
                <button
              className="bg-blue-600 text-white px-4 py-2 rounded w-full"
              onClick={() => setShowAddManual(true)}
            >
              Add
            </button>
            </ul>
          
            <div className="flex flex-col gap-2 mt-4">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded w-full"
                onClick={() => setShowTakePhoto(true)}
              >
                Proceed
              </button>
              
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-600 text-center mt-4">
          {error}
          <button
            onClick={reset}
            className="block mt-4 underline"
          >
            Try again
          </button>
        </div>
      )}

      {showScanOverlay && (
        <ScanOverlay setShowScanOverlay={setShowScanOverlay}/>
      )}
    </main>
  );

  
}
