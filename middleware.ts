import { NextRequest, NextResponse } from "next/server"
import { checkAndIncrementUsage } from "@/lib/carriers"

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const key = req.headers.get("x-api-key") ?? ""
    const { allowed, reason } = await checkAndIncrementUsage(key)
    if (!allowed)
      return NextResponse.json({ error: reason ?? "Unauthorized" }, { status: 401 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"],
}
