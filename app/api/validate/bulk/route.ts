import { NextRequest, NextResponse } from "next/server"
import { lookupCarrier } from "@/lib/carriers"

export async function POST(req: NextRequest) {
  const { numbers } = await req.json()
  if (!Array.isArray(numbers) || numbers.length === 0)
    return NextResponse.json(
      { error: "numbers array is required" },
      { status: 400 }
    )
  if (numbers.length > 100)
    return NextResponse.json(
      { error: "Max 100 numbers per request" },
      { status: 400 }
    )

  const results = numbers.map(({ phone, country_code }: any) => {
    const r = lookupCarrier(phone, country_code)
    return r ?? { valid: false, error: `Unsupported country: ${country_code}` }
  })

  return NextResponse.json({ count: results.length, results })
}
