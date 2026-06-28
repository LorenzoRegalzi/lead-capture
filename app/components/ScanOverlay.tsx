
export default function ScanOverlay({
  setShowScanOverlay,
  text,
  error,
}: {
  setShowScanOverlay: (show: boolean) => void;
  text?: string;
  error?: boolean;
}) {
  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 flex-col bg-opacity-80 ${
        error ? 'bg-red-600' : 'bg-green-600'
      }`}
      onClick={() => setShowScanOverlay(false)}
      style={{ cursor: 'pointer' }}
    >
      <span className="text-white text-4xl font-bold text-center px-6">
        {text || '✅ Item scanned'}
      </span>
      <span className="text-white text-lg mt-4">Tap anywhere to continue</span>
    </div>
  );
}