import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Prevent crashes on Vercel if Env Variables are not configured in settings
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Supabase environment variables are missing on Vercel deployment! Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    return response
  }

  const url = request.nextUrl.clone()

  // Skip middleware checks on assets early to avoid database connections or edge crashes
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/sw.js' ||
    url.pathname === '/favicon.ico' ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.ico')
  ) {
    return response
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Not authenticated
    if (!user) {
      if (url.pathname !== '/login') {
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
      return response
    }

    // Authenticated: fetch profile info
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active')
      .eq('id', user.id)
      .single()

    // Inactive user: force sign out
    if (!profile || !profile.active) {
      const signOutResponse = NextResponse.redirect(new URL('/login', request.url))
      signOutResponse.cookies.delete('sb-access-token')
      signOutResponse.cookies.delete('sb-refresh-token')
      return signOutResponse
    }

    // Redirect roots or logins to matching dashboards
    if (url.pathname === '/login' || url.pathname === '/') {
      if (profile.role === 'ADMIN') {
        url.pathname = '/admin/dashboard'
        return NextResponse.redirect(url)
      } else {
        url.pathname = '/kiosk'
        return NextResponse.redirect(url)
      }
    }

    // Security gate: kiosk cannot touch admin screens
    if (url.pathname.startsWith('/admin') && profile.role !== 'ADMIN') {
      url.pathname = '/kiosk'
      return NextResponse.redirect(url)
    }

  } catch (error) {
    console.error('Middleware execution error caught:', error)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (service worker)
     * - logo.png, logo.jpg, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.png$).*)',
  ],
}
