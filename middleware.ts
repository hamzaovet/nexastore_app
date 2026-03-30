import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_USER = 'admin'
const ADMIN_PASS = '123456'

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization') ?? ''

  if (authHeader.startsWith('Basic ')) {
    // ⚠️  atob() is browser-only and crashes in the Edge/Node middleware runtime.
    //     Buffer.from() works in both Edge and Node runtimes on Vercel.
    try {
      const base64    = authHeader.slice(6)              // strip "Basic "
      const decoded   = Buffer.from(base64, 'base64').toString('utf-8')
      const colonIdx  = decoded.indexOf(':')
      const user      = decoded.slice(0, colonIdx)
      const pass      = decoded.slice(colonIdx + 1)

      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        return NextResponse.next()
      }
    } catch {
      // Malformed base64 — fall through to 401
    }
  }

  // No header or wrong credentials — challenge the browser
  return new NextResponse('Unauthorized — Almaz Dashboard', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Almaz Dashboard", charset="UTF-8"',
      'Content-Type':     'text/plain; charset=utf-8',
    },
  })
}

export const config = {
  // Match both the bare /dashboard route AND every sub-path
  matcher: ['/dashboard', '/dashboard/:path*'],
}