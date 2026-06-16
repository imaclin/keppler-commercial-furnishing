import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

// Logout CSRF here is low-risk (nuisance only); revisit if it becomes a concern.
export async function POST(request: Request) {
  await destroySession();
  return NextResponse.redirect(new URL('/login', request.url));
}
