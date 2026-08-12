import { createClient } from '@/lib/supabase/server'
import WaiversClient from './WaiversClient'

export const revalidate = 0
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    search?: string
    lang?: string
    ageGroup?: string
    tablet?: string
    date?: string
  }>
}

export default async function WaiversPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  // Resolve searchParams promise
  const params = await searchParams
  const search = params.search || ''
  const lang = params.lang || ''
  const ageGroup = params.ageGroup || ''
  const tablet = params.tablet || ''
  const date = params.date || ''

  // Begin build query
  let query = supabase
    .from('waivers')
    .select(`
      *,
      profiles (full_name),
      guardian_information (*)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  // Search parameters
  if (search) {
    query = query.or(`waiver_number.ilike.%${search}%,full_name.ilike.%${search}%,id_passport.ilike.%${search}%`)
  }

  // Filter properties
  if (lang) {
    query = query.eq('language', lang)
  }

  if (ageGroup) {
    if (ageGroup === 'minor') {
      query = query.eq('is_minor', true)
    } else if (ageGroup === 'adult') {
      query = query.eq('is_minor', false)
    }
  }

  if (tablet) {
    query = query.eq('tablet_user_id', tablet)
  }

  if (date) {
    // Match date string (YYYY-MM-DD) inside Costa Rica timezone
    // The DB stores UTC. Costa Rica offset is UTC-6.
    const startUTC = new Date(date + 'T00:00:00')
    startUTC.setHours(startUTC.getHours() + 6) // Shift 6 hours to UTC
    
    const endUTC = new Date(date + 'T23:59:59')
    endUTC.setHours(endUTC.getHours() + 6)

    query = query.gte('created_at', startUTC.toISOString()).lte('created_at', endUTC.toISOString())
  }

  const { data: waivers, count } = await query

  // Retrieve profiles for filter select
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name')

  return (
    <WaiversClient
      waivers={waivers || []}
      totalCount={count || 0}
      profiles={profiles || []}
      currentFilters={{ search, lang, ageGroup, tablet, date }}
    />
  )
}
