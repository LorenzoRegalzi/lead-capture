import React from 'react';

export default function TakePhotoComponent({
  photos,
  uploading,
  handlePhoto,
  handleUpload,
}: {
  photos: File[] | null;
  uploading: boolean;
  handlePhoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpload: () => void;
}) {
  return (
    <main className="h-dvh w-screen flex flex-col bg-white items-center justify-center">
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
                  onClick={() => console.warn('Delete functionality not implemented yet')}
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
            disabled={!!photos && photos.length >= 4}
            multiple
            onChange={handlePhoto}
            style={{ display: 'none' }}
          />
        </label>
        {photos && (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded w-full"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'Send...' : 'Send photo'}
          </button>
        )}
        <button
          className="bg-gray-300 text-black px-4 py-2 rounded w-full"
          onClick={() => {
            handleUpload();
          }}
        >
          Skip photo and submit
        </button>
      </div>
    </main>
  );
}