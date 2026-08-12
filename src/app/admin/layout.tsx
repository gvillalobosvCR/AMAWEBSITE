import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayoutClient from './AdminLayoutClient'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <AdminLayoutClient userProfile={profile}>
      {children}
    </AdminLayoutClient>
  )
}
