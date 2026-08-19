'use server'

import nodemailer from 'nodemailer'
import { createClient } from '@/lib/supabase/server'

interface SendEmailParams {
  email: string
  fullName: string
  waiverNumber: string
  pdfBase64: string
}

export async function sendWaiverEmail(params: SendEmailParams) {
  const supabase = await createClient()

  // 1. Fetch SMTP configuration
  const { data: smtpData } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'smtp_settings')
    .single()

  const { data: emailData } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'email_settings')
    .single()

  const smtp = smtpData?.value?.value || {}
  const emailTpl = emailData?.value?.value || {}

  // Defaults
  const host = smtp.host || ''
  const port = smtp.port || 587
  const user = smtp.user || ''
  const password = smtp.password || ''
  const secure = smtp.secure || false
  const fromName = smtp.fromName || 'Arenal Mundo Aventura'
  const fromEmail = smtp.fromEmail || user || ''

  const subjectTemplate = emailTpl.subject || 'Su Descargo de Responsabilidad / Your Waiver Form'
  const bodyTemplate = emailTpl.body || 'Hola {name},\n\nAdjunto encontrará la copia en PDF de su descargo de responsabilidad firmado.\n\nHello {name},\n\nPlease find attached the PDF copy of your signed waiver form.'

  if (!host || !user || !password) {
    return { error: 'SMTP no configurado en los ajustes administrativos. / SMTP not configured in admin settings.' }
  }

  // 2. Replace placeholders in subject and body
  const subject = subjectTemplate
    .replace(/{name}/g, params.fullName)
    .replace(/{waiver_number}/g, params.waiverNumber)

  const text = bodyTemplate
    .replace(/{name}/g, params.fullName)
    .replace(/{waiver_number}/g, params.waiverNumber)

  try {
    // 3. Create Transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure, // true for 465, false for other ports
      auth: {
        user,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false, // Prevents certificate verification issues
      },
    })

    // 4. Send mail
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: params.email,
      subject,
      text,
      attachments: [
        {
          filename: `Waiver_${params.waiverNumber}.pdf`,
          content: Buffer.from(params.pdfBase64, 'base64'),
          contentType: 'application/pdf',
        },
      ],
    })

    console.log('Message sent: %s', info.messageId)
    return { success: true }
  } catch (err: any) {
    console.error('SMTP sending error:', err)
    return { error: 'Error enviando correo / Error sending email: ' + err.message }
  }
}
