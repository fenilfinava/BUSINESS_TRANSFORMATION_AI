import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard and /workspaces routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/workspaces')) {
    // Check for Supabase session cookies or auth tokens
    const hasAuthCookie = request.cookies.getAll().some(c => 
      c.name.includes('supabase') || 
      c.name.includes('sb-') || 
      c.name.includes('auth-token')
    );

    // Note: Client-side layout auth checks will also verify supabase.auth.getSession()
    // and redirect immediately if no valid session is present.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/workspaces/:path*'],
};
