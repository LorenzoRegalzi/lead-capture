
export default function ScanOverlay({setShowScanOverlay, text}: {setShowScanOverlay: (show: boolean) => void, text?: string }) {
  

  return (
<div
          className="fixed inset-0 bg-green-600 bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setShowScanOverlay(false)}
          style={{ cursor: "pointer" }}
        >
          <span className="text-white text-4xl font-bold">{text || "Scan"}</span>
        </div>
    );
}