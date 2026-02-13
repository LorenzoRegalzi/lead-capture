import React from 'react';
import QrScanner from '@/app/components/QrScanner';
import CompanyCodeInput from '@/app/components/CompanyCodeInput';

type MainContentProps = {
  companyCode: string | null;
  setCompanyCode: (code: string) => void;
  barcodes: { barcode: string; quantity: number }[];
  increment: (idx: number) => void;
  decrement: (idx: number) => void;
  handleScan: (code: string) => void;
  setShowAddManual: (value: boolean) => void;
  setShowTakePhoto: (value: boolean) => void;
};

export default function MainContentComponent({
  companyCode,
  setCompanyCode,
  barcodes,
  increment,
  decrement,
  handleScan,
  setShowAddManual,
  setShowTakePhoto,
}: MainContentProps) {
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
          <div className="w-full bg-gray-50 border-t border-gray-200 p-4 overflow-y-auto flex-1 flex flex-col">
            <h2 className="font-semibold mb-2 text-blue-700 flex justify-between items-center">
              <span>Company code: {companyCode}</span>
              <span className="text-base text-black font-normal">
                Total: {barcodes.reduce((acc, cur) => acc + cur.quantity, 0)}
              </span>
            </h2>
            <ul className="flex-1">
                <button
                className="bg-blue-950 text-white px-4 py-2 rounded w-full mb-4"
                onClick={() => setShowAddManual(true)}
              >
                Add barcode manually
              </button>
              {barcodes.map((item, idx) => (
                <li
                  key={item.barcode + idx}
                  className="flex justify-between items-center py-1 text-black"
                  style={{ height: '60px' }}
                >
                  <span className="font-mono">{item.barcode}</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="bg-blue-950 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold transition hover:bg-blue-700 active:bg-blue-800"
                      onClick={() => increment(idx)}
                      aria-label="Increment"
                    >
                      +
                    </button>
                    <span className="text-lg font-semibold">x{item.quantity}</span>
                    <button
                      className="bg-gray-300 text-black rounded-full w-10 h-10  flex items-center justify-center text-2xl font-bold transition hover:bg-gray-400 active:bg-gray-500"
                      onClick={() => decrement(idx)}
                      aria-label="Decrement"
                    >
                      −
                    </button>
                  </div>
                </li>
              ))}
              
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
    </main>
  );
}