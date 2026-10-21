type ErrorMessageProps = {
  error: string;
  onBack: () => void;
  onRetry?: () => void;
};

export default function ErrorMessage({ error, onBack, onRetry }: ErrorMessageProps) {
  return (
    <div className="h-dvh w-screen flex flex-col items-center justify-center gap-4 px-6">
      <p className="text-red-600 text-center font-semibold">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-950 text-white px-6 py-3 rounded w-full max-w-sm"
        >
          Retry
        </button>
      )}
      <button
        onClick={onBack}
        className="border border-gray-400 text-gray-700 px-6 py-3 rounded w-full max-w-sm"
      >
        Go back
      </button>
    </div>
  );
}