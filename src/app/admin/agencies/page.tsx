import { createClient } from '@/lib/supabase/server'
import AgenciesClient from './AgenciesClient'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function AgenciesPage() {
  const dbClient = await createClient()

  // Fetch all agencies ordered by name
  const { data: agencies } = await dbClient
    .from('agencies')
    .select('*')
    .order('name', { ascending: true })

  return <AgenciesClient initialAgencies={agencies || []} />
}
