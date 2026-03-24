import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const { code } = JSON.parse(body);
    const validCode = process.env.ACCESS_CODE;

    if (!validCode) {
      return NextResponse.json({ error: "No access code configured" }, { status: 500 });
    }

    if (code?.trim().toUpperCase() === validCode.trim().toUpperCase()) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}