import { useState } from "react";

export default function CompanyCodeInput({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [code, setCode] = useState("");

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
      <div className="flex flex-col items-center justify-center flex-1 w-full">
        <h2 className="text-xl font-bold mb-4 text-blue-950">Welcome, insert Company code</h2>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Company code"
          className="text-black border border-blue-950 rounded px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        className="w-[90%] mx-auto mb-6 py-3 bg-blue-950 text-white font-semibold text-lg rounded-t fixed left-1/2 -translate-x-1/2 bottom-0 cursor-pointer" 
        disabled={!code.trim()}
        onClick={() => onSubmit(code.trim())}
      >
        Continue
      </button>
    </div>
  );
}