import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const supabase = await createClient();

  // Check if auth token cookie exists and set session
  let session = null;
  const authTokenCookie = request.cookies.get('sb-futumeicryffbsoofjri-auth-token');
  
  if (authTokenCookie) {
    try {
      // Parse the auth token from JSON
      const authToken = JSON.parse(authTokenCookie.value);
      
      // Manually set the session in Supabase
      const { data: { session: setSession } } = await supabase.auth.setSession({
        access_token: authToken.access_token,
        refresh_token: authToken.refresh_token,
      });
      
      session = setSession;
    } catch (e) {
      // Failed to parse auth token
    }
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/my-bids', '/my-asks', '/orders', '/profile'];
  const adminRoutes = ['/admin'];
  
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  const isAdminRoute = adminRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if not authenticated
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check admin role for admin routes
  if (isAdminRoute && session) {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', session.user.id)
      .single();

    if (user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') && session) {
    return NextResponse.redirect(new URL('/products', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/my-bids/:path*',
    '/my-asks/:path*',
    '/orders/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/login',
    '/register'
  ]
};
