import { createClient } from '@/lib/supabase/server'
import KioskClient from './KioskClient'

// Force dynamic rendering to fetch fresh texts/settings on load
export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function KioskPage() {
  const supabase = await createClient()

  // Fetch active waiver text
  const { data: activeVersion } = await supabase
    .from('waiver_versions')
    .select('*')
    .eq('is_active', true)
    .single()

  // Fetch application settings
  const { data: settingsData } = await supabase
    .from('app_settings')
    .select('key, value')

  const settings: Record<string, any> = {}
  settingsData?.forEach((item) => {
    settings[item.key] = item.value?.value
  })

  const minAge = settings.min_age ?? 18
  const inactivityTimeout = settings.inactivity_timeout ?? 120
  const confirmationTimeout = settings.confirmation_timeout ?? 5

  return (
    <KioskClient
      activeVersion={activeVersion || {
        id: '00000000-0000-0000-0000-000000000000',
        version: '1.0',
        title_es: 'Descargo de Responsabilidad',
        title_en: 'Liability Waiver',
        content_es: 'Texto de descargo no configurado en la base de datos.',
        content_en: 'Waiver text not configured in database.',
      }}
      minAge={minAge}
      inactivityTimeout={inactivityTimeout}
      confirmationTimeout={confirmationTimeout}
    />
  )
}
