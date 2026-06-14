import { NextResponse } from "next/server"
import { CARRIERS } from "@/lib/carriers"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    countries_supported: Object.keys(CARRIERS),
    version: "1.0.0",
  })
}
