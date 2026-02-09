import React, { useState } from 'react';

export default function AddManualBarcodeComponent({
  onAdd,
  onCancel,
}: {
  onAdd: (barcode: string, quantity: number) => void;
  onCancel: () => void;
}) {
  const [manualBarcode, setManualBarcode] = useState('');
  const [manualQuantity, setManualQuantity] = useState(1);

  return (
    <main className="h-[100dvh] w-screen flex flex-col bg-white items-center justify-center">
      <div className="max-w-sm w-full bg-gray-50 border border-gray-200 p-4 rounded-lg">
        <h2 className="font-semibold mb-4 text-blue-700">Add barcode manually</h2>
        <input
          type="text"
          placeholder="Barcode"
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          className="w-full mb-2 p-2 border rounded text-black"
        />
        <input
          type="number"
          min={1}
          placeholder="Quantity"
          value={manualQuantity}
          onChange={(e) => setManualQuantity(Number(e.target.value))}
          className="w-full mb-4 p-2 border rounded text-black"
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded w-full mb-2"
          onClick={() => {
            onAdd(manualBarcode, manualQuantity);
            setManualBarcode('');
            setManualQuantity(1);
          }}
          disabled={!manualBarcode.trim() || manualQuantity < 1}
        >
          Add
        </button>
        <button
          className="bg-gray-300 text-black px-4 py-2 rounded w-full"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </main>
  );
}