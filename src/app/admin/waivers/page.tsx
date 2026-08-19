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
    startDate?: string
    endDate?: string
    agency?: string
    page?: string
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
  const startDate = params.startDate || ''
  const endDate = params.endDate || ''
  const agency = params.agency || ''
  const pageStr = params.page || '1'
  const page = parseInt(pageStr, 10) || 1
  const pageSize = 20

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Begin build query
  let query = supabase
    .from('waivers')
    .select(`
      *,
      profiles (full_name),
      guardian_information (*),
      agencies (name)
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

  if (agency) {
    query = query.eq('agency_id', agency)
  }

  if (startDate) {
    const startUTC = new Date(startDate + 'T00:00:00')
    startUTC.setHours(startUTC.getHours() + 6) // Shift 6 hours to UTC (Costa Rica offset is UTC-6)
    query = query.gte('created_at', startUTC.toISOString())
  }

  if (endDate) {
    const endUTC = new Date(endDate + 'T23:59:59')
    endUTC.setHours(endUTC.getHours() + 6)
    query = query.lte('created_at', endUTC.toISOString())
  }

  // Apply pagination range limit
  query = query.range(from, to)

  const { data: waivers, count } = await query

  // Retrieve profiles for filter select
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name')

  // Retrieve agencies for filter select
  const { data: agencies } = await supabase
    .from('agencies')
    .select('id, name')
    .order('name')

  return (
    <WaiversClient
      waivers={waivers || []}
      totalCount={count || 0}
      profiles={profiles || []}
      agencies={agencies || []}
      currentPage={page}
      pageSize={pageSize}
      currentFilters={{ search, lang, ageGroup, tablet, startDate, endDate, agency }}
    />
  )
}
