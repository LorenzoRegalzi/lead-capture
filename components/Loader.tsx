
export default function Loader() {
  

  return (
<main className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-black bg-opacity-80 z-50 fixed inset-0">
          <div className="flex flex-col items-center">
            <div className="loader mb-4" />
            <span className="text-white text-2xl font-bold">Send Data...</span>
          </div>
          {/* Loader CSS */}
          <style>{`
          .loader {
            border: 8px solid #f3f3f3;
            border-top: 8px solid #3498db;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}</style>
        </main>
    );
}