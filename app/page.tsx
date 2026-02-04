"use client";

import { useState, useRef, useEffect } from "react";
import QrScanner from "@/components/QrScanner";
import CompanyCodeInput from "@/components/CompanyCodeInput";

type BarcodeItem = {
  barcode: string;
  quantity: number;
  url: string;
  companyCode: string | null;
};

export default function Home() {
  const [barcodes, setBarcodes] = useState<BarcodeItem[]>([
    { barcode: "123456789012", quantity: 2, url: "test", companyCode: '123' },
    { barcode: "987654321098", quantity: 1, url: "test", companyCode: '123' },
    // ...altri dati di test...
  ]);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sezioni
  const [showSubmit, setShowSubmit] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [manualQuantity, setManualQuantity] = useState(1);
  const [sending, setSending] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  function fetchLead(code: string) {
    setLoading(true);
    setError(null);

    fetch(`/api/capture-lead?barcode=${encodeURIComponent(code)}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setLead(data))
      .catch(() => setError("Unable to retrieve lead data. Please try again."))
      .finally(() => setLoading(false));
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
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        { barcode: code, quantity: 1, url: "test", companyCode },
      ];
    });
    fetchLead(code);
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
          url: "test",
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


  // Sezione submit
  if (showSubmit) {
    async function handleProceed() {
      setSending(true);
      setSubmitResult(null);
      try {
        const res = await fetch("/api/save-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyCode,
            barcodes,
          }),
        });
        const data = await res.json();
        if (data.status === "ok") {
          setSubmitResult("Dati inviati con successo!");
        } else {
          setSubmitResult("Errore: " + (data.message || "Invio fallito"));
        }
      } catch (err) {
        setSubmitResult("Errore di rete");
      } finally {
        setSending(false);
      }
    }

    return (
      <main className="h-[100dvh] w-screen flex flex-col bg-white items-center justify-center">
        <h1 className="text-2xl font-bold text-blue-700 mb-8">eccoci</h1>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded mb-4"
          onClick={handleProceed}
          disabled={sending}
        >
          {sending ? "Invio in corso..." : "Proceed"}
        </button>
        {submitResult && (
          <div className="mb-4 text-center text-blue-700">{submitResult}</div>
        )}
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => setShowSubmit(false)}
          disabled={sending}
        >
          Back
        </button>
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
            <QrScanner onScan={addBarcode} />
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
                      className="bg-gray-300 text-black rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold transition hover:bg-gray-400 active:bg-gray-500"
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
                onClick={() => setShowSubmit(true)}
              >
                Submit
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                onClick={() => setShowAddManual(true)}
              >
                Add
              </button>
            </div>
          </div>
        </div>
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
