import React from 'react';
import QrScanner from '@/app/components/QrScanner';
import type { BarcodeEntry, Store } from '@/app/lib/lead';

type MainContentProps = {
  store: Store;
  barcodes: BarcodeEntry[];
  onIncrement: (barcode: string) => void;
  onDecrement: (barcode: string) => void;
  onScan: (code: string) => void;
  onOpenManual: () => void;
  onProceed: () => void;
  onBack: () => void;
};

export default function MainContent({
  store,
  barcodes,
  onIncrement,
  onDecrement,
  onScan,
  onOpenManual,
  onProceed,
  onBack,
}: MainContentProps) {
  return (
    <main className="h-[100dvh] w-screen flex flex-col bg-white">
      <div className="w-full flex flex-col justify-center h-[100vh]">
        <div className="flex items-center justify-center w-full">
          <QrScanner onScan={onScan} />
        </div>
        <div className="w-full bg-gray-50 border-t border-gray-200 p-4 overflow-y-auto flex-1 flex flex-col">
          <h2 className="font-semibold mb-2 text-blue-700 flex justify-between items-center gap-2">
            <button className="text-blue-950 font-semibold shrink-0" onClick={onBack}>
              ← Back
            </button>
            <span className="truncate">{store.name} #{store.number}</span>
            <span className="text-base text-black font-normal">
              Total: {barcodes.reduce((acc, cur) => acc + cur.quantity, 0)}
            </span>
          </h2>
            <ul className="flex-1">
                <button
                className="bg-blue-950 text-white px-4 py-2 rounded w-full mb-4"
                onClick={onOpenManual}
              >
                Add barcode manually
              </button>
              {[...barcodes].reverse().map((item, reversedIdx) => {
                const isLatest = reversedIdx === 0;
                return (
                <li
                  key={item.barcode}
                  className={`flex justify-between items-center py-1 text-black mb-2 px-2 rounded-lg transition-all ${
                    isLatest
                      ? 'border-2 border-blue-950 font-semibold rounded-lg'
                      : ''
                  }`}
                  style={{ height: '60px' }}
                >
                  <span className="font-mono">{item.barcode}</span>
                  <div className="flex items-center gap-2 ">
                    <button
                      className="bg-blue-950 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold transition hover:bg-blue-700 active:bg-blue-800 rounded-button"
                      onClick={() => onIncrement(item.barcode)}
                      aria-label="Increment"
                    >
                      +
                    </button>
                    <span className="text-lg font-semibold">x{item.quantity}</span>
                    <button
                      className="bg-gray-300 text-black rounded-full w-10 h-10  flex items-center justify-center text-2xl font-bold transition hover:bg-gray-400 active:bg-gray-500 rounded-button"
                      onClick={() => onDecrement(item.barcode)}
                      aria-label="Decrement"
                    >
                      −
                    </button>
                  </div>
                </li>
                );
              })}
              
            </ul>

            <div className="flex flex-col gap-2 mt-4">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded w-full"
                onClick={onProceed}
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
    </main>
  );
}