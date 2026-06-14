import { useState } from "react";

export default function CompanyCodeInput({ onSubmit }: { onSubmit: (storeName: string, storeNumber: string) => void }) {
  const [storeName, setStoreName] = useState("");
  const [storeNumber, setStoreNumber] = useState("");

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
      <div className="flex flex-col items-center justify-center flex-1 w-full gap-4">
        <h2 className="text-xl font-bold mb-4 text-blue-950 text-center">Welcome,<br />please insert the store name<br />and store number</h2>
        <input
          type="text"
          value={storeName}
          onChange={e => setStoreName(e.target.value)}
          placeholder="Store name"
          className="text-black border border-blue-950 rounded px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
        />
        <input
          type="text"
          value={storeNumber}
          onChange={e => setStoreNumber(e.target.value)}
          placeholder="Store number"
          className="text-black border border-blue-950 rounded px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
        />
      </div>
      <button
        className="w-[90%] mx-auto mb-6 py-3 bg-blue-950 text-white font-semibold text-lg rounded-t fixed left-1/2 -translate-x-1/2 bottom-0 cursor-pointer"
        onClick={() => {
          if (!storeName.trim() || !storeNumber.trim()) {
            alert('Please fill in both Store Name and Store Number.');
            return;
          }
          onSubmit(storeName.trim(), storeNumber.trim());
        }}
      >
        Continue
      </button>
    </div>
  );
}