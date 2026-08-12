import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.active) {
    redirect('/login')
  }

  if (profile.role === 'ADMIN') {
    redirect('/admin/dashboard')
  } else {
    redirect('/kiosk')
  }
}

