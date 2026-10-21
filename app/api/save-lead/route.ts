import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    console.log("Lead received:", data);
    if (Array.isArray(data.barcodes)) {
      console.log("Barcodes received:", data.barcodes);
    }

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (!scriptUrl) {
      console.error("GOOGLE_SCRIPT_URL is not set");
      return NextResponse.json(
        { status: "error", message: "Server misconfigured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      scriptUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      console.error("Apps Script error:", response.status, await response.text());
      return NextResponse.json(
        { status: "error", message: `Apps Script error: ${response.status}` },
        { status: 502 }
      );
    }

    const result = await response.json();

    if (result?.status === "error") {
      console.error("Apps Script returned error:", result);
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("SAVE LEAD ERROR:", err);
    return NextResponse.json(
      { status: "error", message: (err as Error).message },
      { status: 500 }
    );
  }
}