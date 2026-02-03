"use client";

import { useState } from "react";
import QrScanner from "@/components/QrScanner";
import CompanyCodeInput from "@/components/CompanyCodeInput";

type BarcodeItem = {
  barcode: string;
  quantity: number;
};

export default function Home() {
  const [barcodes, setBarcodes] = useState<BarcodeItem[]>([]);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchLead(code: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/capture-lead?barcode=${encodeURIComponent(code)}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLead(data);
    } catch {
      setError("Unable to retrieve lead data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setBarcodes([]);
    setLead(null);
    setError(null);
  }

  function addBarcode(code: string) {
    setBarcodes((prev) => {
      const idx = prev.findIndex((b) => b.barcode === code);
      if (idx !== -1) {
        // Increment quantity if barcode already exists
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      // Add new barcode
      return [...prev, { barcode: code, quantity: 1 }];
    });
    fetchLead(code);
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

  return (
    <main className="h-[100dvh] w-screen flex flex-col items-center justify-center p-4 bg-white">
      {companyCode == null && (
        <CompanyCodeInput
          onSubmit={(code) => {
            setCompanyCode(code);
          }}
        />
      )}

      {companyCode !== null && (
        <>
          <h1 className="text-2xl font-bold mb-6 text-blue-700">
            Company code: {companyCode}
          </h1>
          <h1 className="text-2xl font-bold mb-6 text-blue-700">
            Scan barcode
          </h1>
          <QrScanner
            onScan={addBarcode}
          />
          {/* Lista barcode */}
          {barcodes.length > 0 && (
            <div className="w-full max-w-sm bg-gray-50 border border-gray-200 p-4 rounded-lg mt-4">
              <h2 className="font-semibold mb-2 text-blue-700">
                Barcodes scanned
              </h2>
              <ul>
                {barcodes.map((item, idx) => (
                  <li
                    key={item.barcode}
                    className="flex justify-between items-center py-1 text-black"
                  >
                    <span className="font-mono">{item.barcode}</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="bg-blue-600 text-white px-2 rounded"
                        onClick={() => increment(idx)}
                      >
                        +
                      </button>
                      <span>x{item.quantity}</span>
                      <button
                        className="bg-gray-300 text-black px-2 rounded"
                        onClick={() => decrement(idx)}
                      >
                        -
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {loading && <p className="mt-4">Loading lead data...</p>}

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
    </main>
  );
}
