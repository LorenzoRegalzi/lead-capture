"use client";

import { useState, useEffect } from "react";
import QrScanner from "@/app/components/QrScanner";
import CompanyCodeInput from "@/app/components/CompanyCodeInput";
import Loader from "@/app/components/Loader";
import ScanOverlay from "@/app/components/ScanOverlay";
import { useBarcodeManager } from "./hooks/useBarcodeManager";
import TakePhotoComponent from "./components/TakePhotoComponent";
import AddManualBarcodeComponent from "./components/AddManualBarcodeComponent";
import MainContentComponent from "./components/MainContentComponent";
import ErrorComponent from "./components/ErrorComponent";


export default function Home() {
  const {
    barcodes,
    companyCode,
    setCompanyCode,
    error,
    setError,
    showLoadingOverlay,
    photos,
    uploading,
    reset,
    addBarcode,
    addManualBarcode,
    increment,
    decrement,
    handlePhoto,
    handleUpload,
    showFinishProcess,
    deletePhoto
  } = useBarcodeManager();

  // Sezioni
  const [showTakePhoto, setShowTakePhoto] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [showScanOverlay, setShowScanOverlay] = useState(false);

  function handleScan(code: string) {
    addBarcode(code);
    setShowScanOverlay(true);
  }

  if (showLoadingOverlay) {
    return <Loader />;
  }

  if (showFinishProcess) {
    return <ScanOverlay setShowScanOverlay={() => {
      window.location.reload();
    }} text="Completed"/>;
  }

  if (showScanOverlay) {
    return <ScanOverlay setShowScanOverlay={setShowScanOverlay} />;
  }
  

  {error && (
    <ErrorComponent error={error} onReset={reset} />
  )}

  if (showTakePhoto) {
    return (
      <TakePhotoComponent
        photos={photos}
        uploading={uploading}
        handlePhoto={handlePhoto}
        handleUpload={handleUpload}
        deletePhoto={deletePhoto}
      />
    );
  }

  if (showAddManual) {
    return (
      <AddManualBarcodeComponent
        onAdd={(barcode, quantity) => {
          addManualBarcode(barcode, quantity);
          setShowAddManual(false);
        }}
        onCancel={() => setShowAddManual(false)}
      />
    );
  }

  if (companyCode == null) {
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
    </main>
    );
  }

   if (companyCode !== null) {
    return (
      <main className="h-[100dvh] w-screen flex flex-col bg-white">
     <MainContentComponent
          companyCode={companyCode}
          setCompanyCode={setCompanyCode}
          barcodes={barcodes}
          increment={increment}
          decrement={decrement}
          handleScan={handleScan}
          setShowAddManual={setShowAddManual}
          setShowTakePhoto={setShowTakePhoto}
        />
    </main>
    );
  }
}
