import { NextResponse, type NextRequest } from 'next/server';

// Optimistic gate only. Storefront is fully public. /account and /admin require a
// session cookie; the page-level helpers (requireCustomer/requireStaff) do the
// real validation and role checks. /api self-authenticates.
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const gated = path.startsWith('/account') || path.startsWith('/admin');
  if (gated && !request.cookies.has('hw_session')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
