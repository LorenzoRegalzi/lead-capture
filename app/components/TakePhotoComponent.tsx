import React from 'react';
import Image from 'next/image';

export default function TakePhotoComponent({
  photos,
  uploading,
  handlePhoto,
  handleUpload,
  deletePhoto,
}: {
  photos: File[] | null;
  uploading: boolean;
  handlePhoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpload: () => void;
  deletePhoto: (index: number) => void;
}) {
  return (
    <main className="h-dvh w-screen flex flex-col bg-white items-center">
      
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
            disabled={!!photos && photos.length >= 4}
            multiple
            onChange={handlePhoto}
            style={{ display: 'none' }}
          />
        </label>
        {photos && (
          <div className="flex flex-col gap-4">
            {[...photos].reverse().map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-4 w-full justify-between">
                <img
                  src={URL.createObjectURL(p)}
                  className="w-40 h-40 object-cover rounded border"
                />
                <button
                  className="bg-red-600 text-white px-3 py-2 rounded"
                  onClick={() => deletePhoto(photos.length - 1 - i)}
                  disabled={uploading}
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
            if (!photos?.length) {
              alert('Please add at least one photo before sending.');
              return;
            }
            handleUpload();
          }}
          disabled={uploading}
        >
          {uploading ? 'Send...' : 'Send Data'}
        </button>
      </div>
    </main>
  );
}