import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    console.log("Lead received:", data);
    if (Array.isArray(data.barcodes)) {
      console.log("Barcodes received:", data.barcodes);
    }

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycby9q7JYisoebbr58rIDfWjRfS4jP-JNTKLsU8hUP_Bk4ipxn7c1Ik4Zg0psEeO_GZ2P/exec",
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