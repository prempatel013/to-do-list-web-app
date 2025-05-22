import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/tasks', '/ai', '/projects', '/settings', '/dashboard'];

// Routes that should redirect to dashboard if user is authenticated
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  // Check for token in both cookie and Authorization header
  const token = request.cookies.get('token')?.value || request.headers.get('Authorization')?.split(' ')[1];
  const { pathname } = request.nextUrl;

  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname === route);

  // If user is not authenticated and trying to access a protected route
  if (!token && isProtectedRoute) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access auth routes
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add token to response headers for client-side access
  const response = NextResponse.next();
  if (token) {
    response.headers.set('Authorization', `Bearer ${token}`);
  }

  return response;
}

// Define matcher as a static array
export const config = {
  matcher: [
    '/tasks/:path*',
    '/ai/:path*',
    '/projects/:path*',
    '/settings/:path*',
    '/login',
    '/signup'
  ]
}; 