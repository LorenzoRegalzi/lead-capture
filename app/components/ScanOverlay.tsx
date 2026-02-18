
export default function ScanOverlay({setShowScanOverlay, text}: {setShowScanOverlay: (show: boolean) => void, text?: string }) {
  

  return (
<div
          className="fixed inset-0 bg-green-600 bg-opacity-80 flex items-center justify-center z-50 flex-col"
          onClick={() => setShowScanOverlay(false)}
          style={{ cursor: "pointer" }}
        >
          <span className="text-white text-4xl font-bold">{text || "✅ Item scanned"}</span>
          {!text && <span className="text-white text-lg mt-4">Tap anywhere to continue</span>}
        </div>
    );
}