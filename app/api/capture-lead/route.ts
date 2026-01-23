import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let barcode = searchParams.get("barcode");

  console.log("Received barcode:", barcode);

  if (!barcode) {
    return NextResponse.json(
      { error: "Missing barcode" },
      { status: 400 }
    );
  }

  var licenseCode = process.env.LEAD_LICENSE_CODE;

  if (!licenseCode) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  licenseCode = "0";

  barcode = "0";
  

  const url = `https://pluslead.mcievents.com/api/sdk/capture?license_code=${encodeURIComponent(
    licenseCode
  )}&barcode=${encodeURIComponent(barcode)}`;

  

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Lead capture failed" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Network error" },
      { status: 500 }
    );
  }
}

