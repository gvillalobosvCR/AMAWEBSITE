'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function login(state: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Por favor complete todos los campos / Please fill in all fields' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Credenciales inválidas / Invalid credentials: ' + error.message }
  }

  // Check if profile is active
  const { data: profile } = await supabase
    .from('profiles')
    .select('active, role')
    .eq('id', data.user.id)
    .single()

  if (!profile || !profile.active) {
    await supabase.auth.signOut()
    return { error: 'Esta cuenta está desactivada / This account is deactivated' }
  }

  revalidatePath('/', 'layout')
  return { success: true, role: profile.role }
}

export async function logOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}
