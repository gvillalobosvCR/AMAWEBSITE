import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import UsersClient from './UsersClient'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const adminClient = createAdminClient()
  const dbClient = await createClient()

  // Fetch all users using admin client (bypasses RLS to read emails)
  const { data: authData } = await adminClient.auth.admin.listUsers()

  // Fetch active states from profiles
  const { data: dbProfiles } = await dbClient
    .from('profiles')
    .select('id, active, role, full_name')

  // Merge data sets
  const usersList = (authData?.users || []).map((u) => {
    const profile = dbProfiles?.find((p) => p.id === u.id)
    return {
      id: u.id,
      email: u.email || '',
      fullName: u.user_metadata?.full_name || profile?.full_name || 'Sin nombre',
      role: u.user_metadata?.role || profile?.role || 'KIOSK',
      active: profile ? profile.active : true,
    }
  })

  return <UsersClient initialUsers={usersList} />
}
