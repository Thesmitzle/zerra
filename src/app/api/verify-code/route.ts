import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const validCode = process.env.ACCESS_CODE;

  if (!validCode) {
    return NextResponse.json({ error: "No access code configured" }, { status: 500 });
  }

  if (code?.trim().toUpperCase() === validCode.trim().toUpperCase()) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid code" }, { status: 401 });
}