import React, { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { MAX_PHOTOS } from '@/app/hooks/useLeadDraft';

export default function TakePhoto({
  photos,
  processingPhotos,
  onAddPhotos,
  onRemovePhoto,
  onSubmit,
  onBack,
}: {
  photos: File[];
  processingPhotos: boolean;
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (index: number) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  // one object URL per photo, revoked when photos change (avoids memory leaks on mobile)
  const previewUrls = useMemo(() => photos.map((p) => URL.createObjectURL(p)), [photos]);
  useEffect(() => () => previewUrls.forEach((u) => URL.revokeObjectURL(u)), [previewUrls]);

  return (
    <main className="h-dvh w-screen flex flex-col bg-white items-center relative">
      <button
        className="absolute top-4 left-4 z-10 text-blue-950 font-semibold disabled:opacity-50"
        onClick={onBack}
        disabled={processingPhotos}
      >
        ← Back
      </button>
      
      <div className="flex flex-col gap-4 w-full max-w-sm flex-grow overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-2 text-blue-950 text-center" style={{marginTop:"100px"}}>Take a clear picture<br /> of <span style={{textDecoration:'underline'}}>EACH SIDE</span><br /> of the display</h2>
      <div className="w-full relative mb-3" style={{ minHeight: '280px' }}>
        <Image src="/help.jpeg" alt="Help" fill className="object-contain" />
      </div>
         <label className="bg-blue-950 text-white px-4 py-2 rounded cursor-pointer text-center big-label mt-4 mb-4 h-14 flex items-center justify-center">
          Take photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={processingPhotos || photos.length >= MAX_PHOTOS}
            multiple
            onChange={(e) => {
              onAddPhotos(Array.from(e.target.files ?? []));
              // allow picking the same file again
              e.target.value = '';
            }}
            style={{ display: 'none' }}
          />
        </label>
        {photos.length > 0 && (
          <div className="flex flex-col gap-4">
            {[...previewUrls].reverse().map((url, i) => (
              <div key={i} className="flex items-center gap-4 w-full justify-between">
                <img
                  src={url}
                  alt={`Photo ${photos.length - i}`}
                  className="w-40 h-40 object-cover rounded border"
                />
                <button
                  className="bg-red-600 text-white px-3 py-2 rounded"
                  onClick={() => onRemovePhoto(photos.length - 1 - i)}
                  disabled={processingPhotos}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
       
      </div>
      <div className="mt-auto w-full max-w-sm px-4 mb-4">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
          onClick={() => {
            if (!photos.length) {
              alert('Please add at least one photo before sending.');
              return;
            }
            onSubmit();
          }}
          disabled={processingPhotos}
        >
          {processingPhotos ? 'Processing photos...' : 'Send Data'}
        </button>
      </div>
    </main>
  );
}