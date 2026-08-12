import { createClient } from '@/lib/supabase/server'
import VersionsClient from './VersionsClient'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function VersionsPage() {
  const supabase = await createClient()

  // Fetch the currently active version
  const { data: activeVersion } = await supabase
    .from('waiver_versions')
    .select('*')
    .eq('is_active', true)
    .single()

  // Fetch all versions list
  const { data: allVersions } = await supabase
    .from('waiver_versions')
    .select('id, version, title_es, is_active, created_at')
    .order('created_at', { ascending: false })

  return (
    <VersionsClient
      activeVersion={activeVersion || {
        id: '00000000-0000-0000-0000-000000000000',
        version: '0.0',
        title_es: 'No configurado',
        title_en: 'Not configured',
        content_es: 'Establezca una versión válida a la derecha.',
        content_en: 'Set a valid version on the right.',
      }}
      allVersions={allVersions || []}
    />
  )
}
