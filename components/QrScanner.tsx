"use client";

import { useState } from "react";
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
};

export default function QrScanner({ onScan }: Props) {
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [tracker, setTracker] = useState<string | undefined>("centerText");
  const [pause, setPause] = useState(false);

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
    <div>
      {/* <div style={styles.controls}>
        <select onChange={(e) => setDeviceId(e.target.value)}>
          <option value={undefined}>Select a device</option>
          {devices.map((device, index) => (
            <option key={index} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
        <select
          style={{ marginLeft: 5 }}
          onChange={(e) => setTracker(e.target.value)}
        >
          <option value="centerText">Center Text</option>
          <option value="outline">Outline</option>
          <option value="boundingBox">Bounding Box</option>
          <option value={undefined}>No Tracker</option>
        </select>
      </div> */}
      <Scanner
        formats={[
          "code_39",
          "code_93",
          "code_128",
          "ean_8",
          "ean_13",
          "itf",
          "upc_a",
          "upc_e",
          "codabar",
          // aggiungi altri formati lineari se necessario
        ]}
        constraints={{
          deviceId: deviceId,
        }}
        onScan={(detectedCodes) => {
          if (detectedCodes[0]) handleScan(detectedCodes[0].rawValue);
        }}
        onError={(error) => {
          console.log(`onError: ${error}'`);
        }}
        styles={{ container: { height: "450px", width: "380px" } }} // area più grande
        components={{
          onOff: true,
          torch: true,
          zoom: true,
          finder: true,
          tracker: getTracker(),
        }}
        allowMultiple={false}
        scanDelay={1000}
        paused={pause}
      />
    </div>
  );
}