import { NextRequest, NextResponse } from "next/server"
import { checkAndIncrementUsage } from "@/lib/carriers"

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Allow health check without auth
  if (path === "/api/health") return NextResponse.next()

  if (path.startsWith("/api/")) {
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
