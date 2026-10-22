"use client";

import { useState } from "react";
import { Scanner, centerText } from "@yudiel/react-qr-scanner";

const SCAN_PAUSE_MS = 500;

// Never wider than the screen: a fixed 400px overflowed 360-390px phones
const styles = {
  container: {
    width: "100%",
    maxWidth: 400,
    margin: "auto",
  },
};

type Props = {
  onScan: (barcode: string) => void;
};

export default function QrScanner({ onScan }: Props) {
  const [pause, setPause] = useState(false);

  const handleScan = (data: string) => {
    setPause(true);
    try {
      onScan(data);
    } catch (error: unknown) {
      console.error(error);
    } finally {
      // short pause so the same barcode isn't scanned twice in a row
      setTimeout(() => setPause(false), SCAN_PAUSE_MS);
    }
  };

  return (
    <div style={styles.container}>
      <Scanner
        formats={["ean_13", "ean_8"]}
        paused={pause}
        constraints={{
          // @ts-expect-error zoom is a valid camera constraint but missing from the DOM typings
          advanced: [{ zoom: 3 }],
        }}
        onScan={(detectedCodes) => {
          handleScan(detectedCodes[0].rawValue);
        }}
        onError={(error) => {
          console.error("Scanner error:", error);
        }}
        styles={{ container: { width: "100%" } }}
        components={{
          onOff: true,
          torch: true,
          zoom: true,
          finder: true,
          tracker: centerText,
        }}
        allowMultiple={false}
      />
    </div>
  );
}
