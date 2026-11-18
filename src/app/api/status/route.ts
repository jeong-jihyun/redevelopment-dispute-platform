import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ lawApi: !!process.env.LAW_OC, ai: !!process.env.GEMINI_API_KEY });
}
