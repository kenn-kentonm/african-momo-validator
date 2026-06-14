import { NextRequest, NextResponse } from "next/server"
import { lookupCarrier } from "@/lib/carriers"

export async function POST(req: NextRequest) {
  const { phone, country_code } = await req.json()
  if (!phone || !country_code)
    return NextResponse.json(
      { error: "phone and country_code are required" },
      { status: 400 }
    )

  const result = lookupCarrier(phone, country_code)
  if (!result)
    return NextResponse.json(
      { error: `Country '${country_code}' not supported` },
      { status: 400 }
    )

  return NextResponse.json(result)
}
