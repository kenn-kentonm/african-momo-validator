import { NextRequest, NextResponse } from "next/server"
import { CARRIERS } from "@/lib/carriers"

export async function GET(
  _req: NextRequest,
  { params }: { params: { country_code: string } }
) {
  const cc = params.country_code.toUpperCase()
  const country = CARRIERS[cc]
  if (!country)
    return NextResponse.json(
      { error: `Country '${cc}' not found` },
      { status: 404 }
    )

  return NextResponse.json({
    country: country.name,
    country_code: cc,
    dial_code: country.dial_code,
    carriers: Object.entries<any>(country.carriers).map(([name, info]) => ({
      name,
      prefixes: info.prefixes,
      mobile_money: info.mobile_money,
      service: info.service,
    })),
  })
}
