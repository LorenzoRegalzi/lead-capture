"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

type Props = {
  onScan: (barcode: string) => void;
};

export default function QrScanner({ onScan }: Props) {
  const readerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [noQrMessage, setNoQrMessage] = useState(false);

  useEffect(() => {
    readerRef.current = new Html5Qrcode("qr-reader");

    return () => {
      readerRef.current?.stop().catch(() => {});
      readerRef.current?.clear()
    };
  }, []);

  async function startScan() {
    setError(null);
    setNoQrMessage(false);

    if (!readerRef.current) {
      setError("Scanner is not initialized.");
      return;
    }

    try {
      await readerRef.current.start(
        { facingMode: "environment" }, // rear camera only
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (isScanning) {
            readerRef.current?.stop().catch(() => {});
            setIsScanning(false);
            setNoQrMessage(false);
            onScan(decodedText);
          }
        },
        (err) => {
          // Mostriamo messaggio solo se la camera è attiva ma QR non rilevato
          if (isScanning) setNoQrMessage(true);
          console.debug("QR scan error:", err);
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.log("error", err);
      setError(
        "Camera access is blocked. Please enable camera permissions in your browser settings."
      );
    }
  }

  return (
    <div className="h-[100dvh] w-screen flex flex-col items-center justify-center gap-4 bg-white p-4">
      
      <div
        id="qr-reader"
        className="w-full max-w-sm aspect-square border-4 border-dashed border-blue-400 mx-auto"
      />

      <button
        onClick={startScan}
        className="w-full py-4 text-lg font-semibold rounded-lg
                   bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                   text-white shadow-md"
      >
        Scan QR Code
      </button>

      {error && (
        <p className="text-red-600 text-center text-sm px-4">{error}</p>
      )}

      {noQrMessage && !error && (
        <p className="text-gray-700 text-center text-sm px-4 mt-2">
          No QR code detected. Please align the QR code inside the frame.
        </p>
      )}
    </div>
  );
}
