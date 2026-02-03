"use client";

import { useState } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

type Props = {
  onScan: (barcode: string) => void;
};

export default function QrScanner2({ onScan }: Props) {
  const [pause, setPause] = useState(false);

  return (
    <div className="flex flex-col items-center">
      <BarcodeScannerComponent
        width={380}
        height={250}
        onUpdate={(err: any, result: any) => {
          if (!pause && result?.text) {
            setPause(true);
            onScan(result.text);
            // Suono feedback (opzionale)
            // const audio = new Audio("/beep.mp3");
            // audio.play();
            setTimeout(() => setPause(false), 500); // Pausa tra scansioni
          }
        }}
        // Solo barcode lineari, escludi QR se vuoi
        // La libreria rileva sia QR che barcode, ma puoi filtrare nel parent
      />
      <p className="mt-2 text-gray-600 text-center">
        Posiziona il codice a barre davanti alla fotocamera
      </p>
    </div>
  );
}