"use client";

import { useRef, useState } from "react";
import {
  Scanner,
  useDevices,
  outline,
  boundingBox,
  centerText,
} from "@yudiel/react-qr-scanner";

const styles = {
  container: {
    width: 400,
    margin: "auto",
  },
  controls: {
    marginBottom: 8,
  },
};

type Props = {
  onScan: (barcode: string) => void;
  containerRef?: React.RefObject<HTMLDivElement> | null;
};

export default function QrScanner({ onScan, containerRef }: Props) {
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [tracker, setTracker] = useState<string | undefined>("centerText");
  const [pause, setPause] = useState(false);
 const processingScanRef = useRef(false);
  const devices = useDevices();

  function getTracker() {
    switch (tracker) {
      case "outline":
        return outline;
      case "boundingBox":
        return boundingBox;
      case "centerText":
        return centerText;
      default:
        return undefined;
    }
  }

  const handleScan = async (data: string) => {
     if (!processingScanRef.current) {
      processingScanRef.current = true;
      onScan(data);
      setTimeout(() => {
        processingScanRef.current = false;
      }, 3000); // 3 secondi di blocco
    }
  };

  return (
    <div ref={containerRef}>
      <Scanner
        formats={[
            // "code_39",
            // "code_93",
            // "codabar",
            // "ean_13",
            // "ean_8",
            // "itf",
            // "upc_a",
            // "upc_e",      
            
            "ean_13", "ean_8"
        ]}
        scanDelay={3000}
        constraints={{
          deviceId: deviceId,
        }}
        onScan={(detectedCodes) => {
          handleScan(detectedCodes[0].rawValue);
        }}
        onError={(error) => {
          console.log(`onError: ${error}'`);
        }}
        styles={{ container: { width: "100%" } }}
        components={{
          onOff: true,
          torch: true,
          zoom: true,
          finder: true,
          tracker: getTracker(),
        }}
        allowMultiple={false}
      />
    </div>
  );
}