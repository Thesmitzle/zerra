import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const { code } = JSON.parse(body);
    const validCodes = (process.env.ACCESS_CODE || "")
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    if (validCodes.length === 0) {
      return NextResponse.json({ error: "No access codes configured" }, { status: 500 });
    }

    if (validCodes.includes(code?.trim().toUpperCase())) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

