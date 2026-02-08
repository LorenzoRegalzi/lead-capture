
export default function ScanOverlay({setShowScanOverlay}: {setShowScanOverlay: (show: boolean) => void}) {
  

  return (
<div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setShowScanOverlay(false)}
          style={{ cursor: "pointer" }}
        >
          <span className="text-white text-4xl font-bold">Scan</span>
        </div>
    );
}