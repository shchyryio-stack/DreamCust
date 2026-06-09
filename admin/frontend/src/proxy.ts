import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('jwt')?.value;

  // Protect /AWIS routes
  if (request.nextUrl.pathname.startsWith('/AWIS') && request.nextUrl.pathname !== '/AWIS/login') {
    if (!token) {
      return NextResponse.redirect(new URL('/AWIS/login', request.url));
    }
  }

  // Redirect authenticated users away from /AWIS/login
  if (request.nextUrl.pathname === '/AWIS/login') {
    if (token) {
      return NextResponse.redirect(new URL('/AWIS/dashboard', request.url));
    }
  }

  // Redirect root to dashboard
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/AWIS/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/AWIS/:path*'],
};

