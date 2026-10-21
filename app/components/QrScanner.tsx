"use client";

import { useCallback, useEffect, useRef } from "react";
import { Scanner, centerText, type IDetectedBarcode } from "@yudiel/react-qr-scanner";

const styles = {
  container: {
    width: 400,
    margin: "auto",
  },
};

// Stable reference: a new object on every render would make the library compare and possibly restart the camera
const CONSTRAINTS: MediaTrackConstraints = {
  // @ts-expect-error zoom is a valid camera constraint but missing from the DOM typings
  advanced: [{ zoom: 3 }],
};

const FORMATS: ("ean_13" | "ean_8")[] = ["ean_13", "ean_8"];

type Props = {
  onScan: (barcode: string) => void;
};

// Don't use the library's `paused` prop: it stops and restarts the camera stream, and doing
// that on every scan eventually leaves the camera stuck. allowMultiple={false} already
// prevents the same barcode from firing twice while it stays in frame.
export default function QrScanner({ onScan }: Props) {
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const handleScan = useCallback((detectedCodes: IDetectedBarcode[]) => {
    const code = detectedCodes[0]?.rawValue;
    if (!code) return;
    try {
      onScanRef.current(code);
    } catch (error: unknown) {
      console.error(error);
    }
  }, []);

  const handleError = useCallback((error: unknown) => {
    console.error("Scanner error:", error);
  }, []);

  return (
    <div style={styles.container}>
      <Scanner
        formats={FORMATS}
        constraints={CONSTRAINTS}
        onScan={handleScan}
        onError={handleError}
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
