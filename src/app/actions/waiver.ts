'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface SubmitWaiverParams {
  fullName: string
  idPassport: string
  age: number
  language: 'es' | 'en'
  signatureBase64: string
  versionId: string
  exactContent: string
  isMinor: boolean
  // Guardian parameters
  guardianName?: string
  guardianIdPassport?: string
  relationship?: string
  guardianSignatureBase64?: string
}

async function uploadSignature(supabase: any, base64String: string, filename: string): Promise<string> {
  // Strip base64 header
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')

  const datePath = new Date().toISOString().split('T')[0].replace(/-/g, '/')
  const filePath = `${datePath}/${filename}_${Date.now()}.png`

  const { data, error } = await supabase.storage
    .from('waiver-signatures')
    .upload(filePath, buffer, {
      contentType: 'image/png',
      upsert: false,
    })

  if (error) {
    throw new Error('Error al subir firma / Error uploading signature: ' + error.message)
  }

  return data.path
}

export async function submitWaiver(params: SubmitWaiverParams) {
  const supabase = await createClient()

  // Verify user is authenticated (kiosk or admin)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado. La tablet debe estar autenticada. / Unauthorized. The tablet must be authenticated.' }
  }

  try {
    // 1. Upload main signature
    const mainSigPath = await uploadSignature(
      supabase,
      params.signatureBase64,
      `sig_${params.idPassport.replace(/\s+/g, '_')}`
    )

    // 2. Generate consecutive number using Database RPC
    const { data: waiverNumber, error: rpcError } = await supabase.rpc('generate_waiver_number')
    if (rpcError || !waiverNumber) {
      throw new Error('Error generating consecutive number: ' + (rpcError?.message || 'unknown'))
    }

    // 3. Create waiver record
    const { data: waiverData, error: waiverError } = await supabase
      .from('waivers')
      .insert({
        waiver_number: waiverNumber,
        full_name: params.fullName,
        id_passport: params.idPassport,
        age: params.age,
        language: params.language,
        exact_content: params.exactContent,
        version_id: params.versionId,
        signature_path: mainSigPath,
        tablet_user_id: user.id,
        is_minor: params.isMinor,
      })
      .select('id')
      .single()

    if (waiverError || !waiverData) {
      throw new Error('Error saving waiver details: ' + waiverError?.message)
    }

    // 4. Save guardian info if minor
    if (params.isMinor && params.guardianSignatureBase64) {
      const guardianSigPath = await uploadSignature(
        supabase,
        params.guardianSignatureBase64,
        `g_sig_${params.guardianIdPassport?.replace(/\s+/g, '_') || 'unknown'}`
      )

      const { error: guardianError } = await supabase
        .from('guardian_information')
        .insert({
          waiver_id: waiverData.id,
          guardian_name: params.guardianName!,
          guardian_id_passport: params.guardianIdPassport!,
          relationship: params.relationship!,
          guardian_signature_path: guardianSigPath,
        })

      if (guardianError) {
        throw new Error('Error saving guardian details: ' + guardianError.message)
      }
    }

    revalidatePath('/admin/waivers')
    return { success: true, waiverNumber }
  } catch (err: any) {
    console.error('Waiver submit failed:', err)
    return { error: err.message || 'Error del servidor al guardar descargo / Server error saving waiver' }
  }
}

export async function getSignatureUrl(path: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('waiver-signatures')
    .createSignedUrl(path, 60)

  if (error) {
    console.error('Error generating signed URL:', error)
    return null
  }
  return data.signedUrl
}

