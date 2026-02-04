import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    console.log("Lead received:", data);
    if (Array.isArray(data.barcodes)) {
      console.log("Barcodes received:", data.barcodes);
    }

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzOxsdIPWoa-8T3aqMw2aqeqTQ9BAtjdl1DFhQ7sy-gefjTYjrcORYPF9uBy5t-JoFj/exec",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ status: "error", message: (err as Error).message });
  }
}