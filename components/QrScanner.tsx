"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

type Props = {
  onScan: (barcode: string) => void;
};

export default function QrScanner({ onScan }: Props) {
  const readerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    readerRef.current = new Html5Qrcode("qr-reader");

    return () => {
      readerRef.current?.stop().catch(() => {});
      readerRef.current?.clear();
    };
  }, []);

  async function startScan() {
    setError(null);

    try {
      await readerRef.current?.start(
        { facingMode: "environment" }, // rear camera only
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          readerRef.current?.stop().catch(() => {});
          onScan(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setError(
        "Camera access is blocked. Please enable camera permissions in your browser settings and reload the page."
      );
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
     

      <div
        id="qr-reader"
        className="w-full max-w-sm aspect-square"
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
        <p className="text-red-600 text-center text-sm px-4">
          {error}
        </p>
      )}
    </div>
  );
}
