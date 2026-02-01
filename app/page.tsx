"use client";

import { useState } from "react";
import QrScanner from "@/components/QrScanner";
import CompanyCodeInput from "@/components/CompanyCodeInput";

export default function Home() {
  const [barcode, setBarcode] = useState<string | null>(null);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  


  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  async function fetchLead(code: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/capture-lead?barcode=${encodeURIComponent(code)}`);
      if (!res.ok) throw new Error();
      console.log("fetchLead response", res);
      const data = await res.json();
      setLead(data);
    } catch {
      setError("Unable to retrieve lead data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setBarcode(null);
    setLead(null);
    setError(null);
  }

 

  return (
    <main className="h-[100dvh] w-screen flex flex-col items-center justify-center p-4 bg-white">

     

      {companyCode == null &&
        <CompanyCodeInput onSubmit={(code) => {
          setCompanyCode(code);
        }} />
      }

      {companyCode !== null && (
        <>
          <h1 className="text-2xl font-bold mb-6 text-blue-700">
            Company code: {companyCode}
          </h1>
          <h1 className="text-2xl font-bold mb-6 text-blue-700">
            Scan barcode
          </h1>
          <QrScanner
            onScan={(code) => {
              console.log("scan", code)
              alert("Success! The barcode: " + code);
              // setBarcode(code);
              // fetchLead(code);
            }}
          />
        </>
      )}

      {loading && <p className="mt-4">Loading lead data...</p>}

      {error && (
        <div className="text-red-600 text-center mt-4">
          {error}
          <button
            onClick={reset}
            className="block mt-4 underline"
          >
            Try again
          </button>
        </div>
      )}
      {lead && ( 
        <div className="w-full max-w-sm bg-blue-50 border border-blue-200 p-4 rounded-lg mt-4">
          <h2 className="font-semibold mb-2 text-blue-700">Lead Information</h2>

          <p  className="text-black" ><strong className="text-black" >Name:</strong> {lead.profile?.first_name} {lead.profile?.last_name}</p>
          <p  className="text-black" ><strong  className="text-black" >Email:</strong> {lead.profile?.email ?? "N/A"}</p>
          <p  className="text-black" ><strong  className="text-black" >Company:</strong> {lead.profile?.company ?? "N/A"}</p>
          <p  className="text-black" ><strong  className="text-black" >Title:</strong> {lead.profile?.title ?? "N/A"}</p>

          <textarea
            placeholder="Add notes here..."
            className="w-full mt-2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={lead.notes || ""}
            onChange={(e) => setLead({ ...lead, notes: e.target.value })}
          />

          <button
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded shadow-md hover:bg-blue-700 active:bg-blue-800"
            onClick={async () => {
              try {
                const res =
                await fetch("/api/save-lead", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    lead_id: lead.lead_id,
                    first_name: lead.profile?.first_name,
                    last_name: lead.profile?.last_name,
                    email: lead.profile?.email,
                    company: lead.profile?.company,
                    title: lead.profile?.title,
                    demographics: lead.profile?.demographics,
                    notes: lead.notes || ""
                  }),
                });
                const data = await res.json();
                if (data.status === "ok") {
                  alert("Lead saved successfully!");
                  reset();
                } else {
                  alert("Error saving lead: " + (data.message || "unknown"));
                }
              } catch (err) {
                alert("Network error. Please try again.");
              }
            }}
          >
            Save Lead
          </button>

          <button
            onClick={reset}
            className="mt-2 w-full border border-blue-600 text-blue-600 py-2 rounded hover:bg-blue-100"
          >
            Cancel / Scan another
          </button>
        </div>
      )}

    </main>
  );
}
