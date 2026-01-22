import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Routes that require authentication (without locale prefix)
const protectedRoutes = ['/dashboard'];

// Check if path matches protected routes (handles locale prefix)
function isProtectedPath(pathname: string): boolean {
  // Remove locale prefix if present (e.g., /en/dashboard -> /dashboard)
  const pathWithoutLocale = pathname.replace(/^\/(en|es|pt)/, '') || '/';
  return protectedRoutes.some(route => pathWithoutLocale.startsWith(route));
}

// Get the locale-aware sign-in URL
function getSignInUrl(request: NextRequest, locale: string): URL {
  return new URL(`/${locale}/sign-in`, request.url);
}

// Extract locale from pathname
function getLocaleFromPath(pathname: string): string {
  const match = pathname.match(/^\/(en|es|pt)/);
  return match ? match[1] : 'en';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Run intl middleware first to handle locale detection and routing
  const intlResponse = intlMiddleware(request);

  // Get the current or detected locale
  const locale = getLocaleFromPath(intlResponse.headers.get('x-middleware-rewrite') || pathname) || 'en';

  // Check if trying to access protected route
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = isProtectedPath(pathname);

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(getSignInUrl(request, locale));
  }

  // Session refresh logic for GET requests
  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

      intlResponse.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString()
        }),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresInOneDay
      });
    } catch (error) {
      console.error('Error updating session:', error);
      intlResponse.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(getSignInUrl(request, locale));
      }
    }
  }

  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
  runtime: 'nodejs'
};
