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

  const smtpSettings = settings.smtp_settings ?? {
    host: '',
    port: 587,
    user: '',
    password: '',
    secure: false,
    fromName: 'Arenal Mundo Aventura',
    fromEmail: '',
  }

  const emailSettings = settings.email_settings ?? {
    subject: 'Su Descargo de Responsabilidad / Your Waiver Form',
    body: 'Hola {name},\n\nAdjunto encontrará la copia en PDF de su descargo de responsabilidad firmado.\n\nHello {name},\n\nPlease find attached the PDF copy of your signed waiver form.',
  }

  return (
    <SettingsClient
      minAge={minAge}
      inactivityTimeout={inactivityTimeout}
      confirmationTimeout={confirmationTimeout}
      kioskPin={kioskPin}
      smtpSettings={smtpSettings}
      emailSettings={emailSettings}
    />
  )
}
