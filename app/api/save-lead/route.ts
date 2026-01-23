import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    console.log("Lead received:", data)

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbx74NAgWbLISl5K40PZ1AKfvlE4S2nIPFpaXHvqyjgHeLWq4k3evETYaaGKmUSoYGMr/exec",
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