import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './src/lib/auth';

// Public pages: landing '/', login, register. Favicon allowed implicitly via asset bypass below.
const PUBLIC_PATHS = new Set(['/', '/login','/register']);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Allow auth APIs (register/login/logout/me/stats) without token
  if (pathname.startsWith('/api/auth')) return NextResponse.next();
  // Allow Next.js internals, static assets & favicon
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/public')) return NextResponse.next();
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  // Everything else requires a valid auth token
  const token = req.cookies.get('auth_token')?.value;
  if (!token || !verifyToken(token)) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Restrict matcher to application top-level routes we care about; exclude _next/static etc.
export const config = {
  matcher: [
    '/','/dashboard','/addition','/subtraction','/multiplication','/division','/growth','/history','/progress','/settings','/login','/register'
  ]
};
