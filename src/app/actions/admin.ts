'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// App settings manager
export async function saveAppSettings(key: string, value: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('app_settings')
    .upsert({
      key,
      value: { value },
      updated_at: new Date().toISOString(),
    })

  if (error) {
    return { error: 'Error al guardar configuración / Error saving settings: ' + error.message }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}

// Waiver Text Versioning
export async function publishWaiverVersion(params: {
  version: string
  titleEs: string
  titleEn: string
  contentEs: string
  contentEn: string
}) {
  const supabase = await createClient()

  // Start by setting all current versions to inactive
  const { error: deactivateError } = await supabase
    .from('waiver_versions')
    .update({ is_active: false })
    .eq('is_active', true)

  if (deactivateError) {
    return { error: 'Error deactivating current versions: ' + deactivateError.message }
  }

  // Insert new active version
  const { error: insertError } = await supabase
    .from('waiver_versions')
    .insert({
      version: params.version,
      title_es: params.titleEs,
      title_en: params.titleEn,
      content_es: params.contentEs,
      content_en: params.contentEn,
      is_active: true,
    })

  if (insertError) {
    // Attempt recovery of setting active back on? Let's just return error
    return { error: 'Error publishing new version: ' + insertError.message }
  }

  revalidatePath('/admin/versions')
  return { success: true }
}

// User Administration
export async function createSystemUser(params: {
  email: string
  password: string
  fullName: string
  role: 'ADMIN' | 'KIOSK'
}) {
  try {
    const adminClient = createAdminClient()

    // 1. Create auth user (automatically triggers profile sync)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        full_name: params.fullName,
        role: params.role,
      },
    })

    if (authError || !authData.user) {
      return { error: 'Error creating auth account: ' + authError?.message }
    }

    // 2. Double check and update profile details just in case trigger needs synchronization
    const supabase = await createClient()
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        role: params.role,
        full_name: params.fullName,
        active: true,
      })

    if (profileError) {
      return { error: 'Error syncing user profile: ' + profileError.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Server error creating user' }
  }
}

export async function toggleUserStatus(userId: string, active: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ active })
    .eq('id', userId)

  if (error) {
    return { error: 'Error changing user status: ' + error.message }
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function resetUserPassword(userId: string, password: string) {
  try {
    const adminClient = createAdminClient()

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: password,
    })

    if (error) {
      return { error: 'Error resetting password: ' + error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Server error resetting password' }
  }
}
