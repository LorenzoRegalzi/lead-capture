import { bucket } from "@/app/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { submissionId } = await req.json();

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    await bucket.deleteFiles({
      prefix: `uploads/${submissionId}/`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE SUBMISSION ERROR:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}