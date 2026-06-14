import React from 'react';

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
      <h2 className="font-semibold mt-4 mb-4 text-blue-950">Please take a clear photo of each side of the display</h2>
      <div className="flex flex-col gap-4 w-full max-w-sm flex-grow overflow-y-auto">
        
        {photos && (
          <div className="flex flex-col gap-4">
            {photos.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-4 w-full justify-between">
                <img
                  src={URL.createObjectURL(p)}
                  className="w-40 h-40 object-cover rounded border"
                />
                <button
                  className="bg-red-600 text-white px-3 py-2 rounded"
                  onClick={() => deletePhoto(i)}
                  disabled={uploading}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
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
      </div>
      <div className="mt-auto w-full max-w-sm px-4 mb-4">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? 'Send...' : 'Send Data'}
        </button>
      </div>
    </main>
  );
}