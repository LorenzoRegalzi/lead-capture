import { bucket } from "@/app/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const requestUrl = new URL(req.url);
    const submissionId = requestUrl.searchParams.get("submissionId");

    console.log("Received submissionId from query:", submissionId); // Debug log

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
        return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `uploads/${submissionId}/${Date.now()}-${file.name}`;

    const fileUpload = bucket.file(fileName);

    await fileUpload.save(buffer, {
        contentType: file.type,
    });

    const [url] = await fileUpload.getSignedUrl({
        action: "read",
        expires: "03-01-2500",
    });

    return NextResponse.json({ url, submissionId });
}
