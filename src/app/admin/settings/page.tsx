import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Fetch settings from database
  const { data: settingsData } = await supabase
    .from('app_settings')
    .select('key, value')

  const settings: Record<string, any> = {}
  settingsData?.forEach((item) => {
    settings[item.key] = item.value?.value
  })

  // Set default values if not defined
  const minAge = settings.min_age ?? 18
  const inactivityTimeout = settings.inactivity_timeout ?? 120
  const confirmationTimeout = settings.confirmation_timeout ?? 5
  const kioskPin = settings.kiosk_pin ?? '1234'

  return (
    <SettingsClient
      minAge={minAge}
      inactivityTimeout={inactivityTimeout}
      confirmationTimeout={confirmationTimeout}
      kioskPin={kioskPin}
    />
  )
}
