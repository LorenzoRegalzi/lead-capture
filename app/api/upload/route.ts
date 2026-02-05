import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

export async function POST(req: Request) {
  try {
    console.log("UPLOAD START");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      console.error("NO FILE");
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    console.log("FILE:", file.name, file.type, file.size);

    const buffer = Buffer.from(await file.arrayBuffer());

    console.log("ENV EXISTS:", !!process.env.GOOGLE_SERVICE_ACCOUNT);
    console.log("FOLDER ID:", process.env.GDRIVE_FOLDER_ID);

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!),
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

    const stream = Readable.from(buffer);

    const res = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [process.env.GDRIVE_FOLDER_ID!],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
    });

    console.log("UPLOAD OK:", res.data.id);

    return NextResponse.json({ fileId: res.data.id });
  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
