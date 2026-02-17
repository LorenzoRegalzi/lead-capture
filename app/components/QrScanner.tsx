"use client";

import { useState, useEffect, useRef } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);

  const devices = useDevices();

  useEffect(() => {
    if (videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        const track = stream.getVideoTracks()[0];
        const capabilities:any = track.getCapabilities();

        if (capabilities.zoom) {
          track.applyConstraints({
            advanced: [{ zoom: 2 } as any], // Imposta il livello di zoom predefinito
          });
        }
      });
    }
  }, []);

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
    setPause(true);
    try {
      onScan(data);
      // Suono feedback
    } catch (error: unknown) {
      console.log(error);
    } finally {
      setTimeout(() => setPause(false), 500); // 1 secondo di pausa
    }
  };

  return (
    <div ref={containerRef} style={styles.container}>
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
        
        paused={pause}
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
      <video ref={videoRef} style={{ display: "none" }} />
    </div>
  );
}