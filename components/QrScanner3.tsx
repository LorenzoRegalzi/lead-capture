"use client";

import { useRef, useEffect } from "react";
import Webcam from "react-webcam";
import Quagga from "quagga";

type Props = {
  onScan: (barcode: string) => void;
};

export default function QrScanner3({ onScan }: Props) {
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    let scanning = true;

    function scanFrame() {
      if (!scanning || !webcamRef.current) return;

      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        console.warn("Scanning frame...",Quagga);
        Quagga.decodeSingle(
          {
            src: imageSrc,
            numOfWorkers: 0,
            inputStream: {
              size: 800,
            },
            decoder: {
              readers: [
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "code_39_reader",
                "code_39_vin_reader",
                "codabar_reader",
                "upc_reader",
                "upc_e_reader",
                "i2of5_reader",
                "2of5_reader",
                "code_93_reader",
              ],
            },
          },
          (result: any) => {
            if (result && result.codeResult && result.codeResult.code) {
              onScan(result.codeResult.code);
              scanning = false;
              setTimeout(() => {
                scanning = true;
              }, 1000); // Pausa tra scansioni
            }
          }
        );
      }
      setTimeout(scanFrame, 300); // intervallo scansione
    }

    scanFrame();

    return () => {
      scanning = false;
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/png"
        width={380}
        height={250}
        videoConstraints={{
          facingMode: "environment",
        }}
      />
      <p className="mt-2 text-gray-600 text-center">
        Posiziona il codice a barre davanti alla fotocamera
      </p>
    </div>
  );
}