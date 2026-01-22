"use client";

import { useState } from "react";
import QrScanner from "@/components/QrScanner";

export default function Home() {
  const [barcode, setBarcode] = useState<string | null>(null);
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // async function fetchLead(code: string) {
  //   setLoading(true);
  //   setError(null);

  //   try {
  //     const res = await fetch(`/api/capture-lead?barcode=${encodeURIComponent(code)}`);
  //     if (!res.ok) throw new Error();

  //     const data = await res.json();
  //     setLead(data);
  //   } catch {
  //     setError("Unable to retrieve lead data. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  function reset() {
    setBarcode(null);
    setLead(null);
    setError(null);
  }

  async function fetchLead(code: string) {
    setLoading(true);
    setError(null);

    try {
      // MOCK DATA per test
      const data = {
        lead_id: "demo-0001",
        profile: {
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          company: "Acme Corp",
          title: "Marketing Manager",
          demographics: [
            { question: "First time attending?", answers: ["Yes"] }
          ]
        },
        notes: ""
      };

      // Simula delay rete
      await new Promise((r) => setTimeout(r, 500));

      setLead(data);
    } catch {
      setError("Unable to retrieve lead data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="h-[100dvh] w-screen flex flex-col items-center justify-center p-4 bg-white">

      <h1 className="text-2xl font-bold mb-6 text-blue-700">
        Lead Capture
      </h1>

      {!barcode && (
        <QrScanner
          onScan={(code) => {
            setBarcode(code);
            fetchLead(code);
          }}
        />
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

          <p><strong>Name:</strong> {lead.profile?.first_name} {lead.profile?.last_name}</p>
          <p><strong>Email:</strong> {lead.profile?.email ?? "N/A"}</p>
          <p><strong>Company:</strong> {lead.profile?.company ?? "N/A"}</p>
          <p><strong>Title:</strong> {lead.profile?.title ?? "N/A"}</p>

          <textarea
            placeholder="Add notes here..."
            className="w-full mt-2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={lead.notes || ""}
            onChange={(e) => setLead({ ...lead, notes: e.target.value })}
          />

          <button
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded shadow-md hover:bg-blue-700 active:bg-blue-800"
            onClick={async () => {
              try {
                const res = await fetch("https://script.google.com/macros/s/AKfycbx5UIsQ6WlxTHNuo4-eQmiZkD1iTjRBv_8Ai_wFz9RTkR92paWmd7MufYAF_x8QhRb-/exec", {
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
