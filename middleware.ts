import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Routes that require authentication (without locale prefix)
const protectedRoutes = ['/dashboard', '/admin'];

// Routes that require admin role
const adminRoutes = ['/admin'];

// Routes that end_user (client) role CAN access
const clientAllowedRoutes = [
  '/dashboard/my-cases',
  '/dashboard/security',
];

// Routes that end_user (client) role CANNOT access (staff/owner only)
const staffOnlyRoutes = [
  '/dashboard/clients',
  '/dashboard/cases',
  '/dashboard/referrals',
  '/dashboard/billing',
  '/dashboard/general',
  '/dashboard/activity',
];

// Remove locale prefix from path
function getPathWithoutLocale(pathname: string): string {
  return pathname.replace(/^\/(en|es|pt)/, '') || '/';
}

// Check if path matches protected routes (handles locale prefix)
function isProtectedPath(pathname: string): boolean {
  const pathWithoutLocale = getPathWithoutLocale(pathname);
  return protectedRoutes.some(route => pathWithoutLocale.startsWith(route));
}

// Check if path requires admin role
function isAdminPath(pathname: string): boolean {
  const pathWithoutLocale = getPathWithoutLocale(pathname);
  return adminRoutes.some(route => pathWithoutLocale.startsWith(route));
}

// Check if path is allowed for client (end_user) role
function isClientAllowedPath(pathname: string): boolean {
  const pathWithoutLocale = getPathWithoutLocale(pathname);
  return clientAllowedRoutes.some(route => pathWithoutLocale.startsWith(route));
}

// Check if path requires staff/owner role (not for clients)
function isStaffOnlyPath(pathname: string): boolean {
  const pathWithoutLocale = getPathWithoutLocale(pathname);
  return staffOnlyRoutes.some(route => pathWithoutLocale.startsWith(route));
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
  const isAdminRoute = isAdminPath(pathname);

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(getSignInUrl(request, locale));
  }

  // Check admin access
  if (isAdminRoute && sessionCookie) {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      if (parsed.user?.role !== 'admin') {
        // Redirect non-admins to dashboard
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
      }
    } catch {
      return NextResponse.redirect(getSignInUrl(request, locale));
    }
  }

  // Check role-based access for dashboard routes
  const pathWithoutLocale = getPathWithoutLocale(pathname);
  if (pathWithoutLocale.startsWith('/dashboard') && sessionCookie) {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const userRole = parsed.user?.role;

      // Client (end_user) trying to access staff-only routes
      if (userRole === 'end_user' && isStaffOnlyPath(pathname)) {
        return NextResponse.redirect(new URL(`/${locale}/dashboard/my-cases`, request.url));
      }

      // Staff/Owner trying to access client-only routes (my-cases)
      // Allow them to see the page but they will see "no data" since they're not clients
      // This is handled by the API returning empty data for non-clients
    } catch {
      return NextResponse.redirect(getSignInUrl(request, locale));
    }
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
