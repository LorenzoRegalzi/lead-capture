import { bucket } from "@/app/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `uploads/${Date.now()}-${file.name}`;

  const fileUpload = bucket.file(fileName);

  await fileUpload.save(buffer, {
    contentType: file.type,
  });

  // genera link pubblico
  const [url] = await fileUpload.getSignedUrl({
    action: "read",
    expires: "03-01-2500",
  });

  return NextResponse.json({ url });
}
