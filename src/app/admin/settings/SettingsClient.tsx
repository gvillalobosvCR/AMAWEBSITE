'use client'

import { useState } from 'react'
import { saveAppSettings } from '@/app/actions/admin'
import { Save, ShieldAlert, Check, Settings, ShieldCheck, Hourglass, Monitor } from 'lucide-react'

interface SmtpSettings {
  host: string
  port: number
  user: string
  password: string
  secure: boolean
  fromName: string
  fromEmail: string
}

interface EmailSettings {
  subject: string
  body: string
}

interface SettingsClientProps {
  minAge: number
  inactivityTimeout: number
  confirmationTimeout: number
  kioskPin: string
  smtpSettings: SmtpSettings
  emailSettings: EmailSettings
}

export default function SettingsClient({
  minAge: initialMinAge,
  inactivityTimeout: initialInactivityTimeout,
  confirmationTimeout: initialConfirmationTimeout,
  kioskPin: initialKioskPin,
  smtpSettings: initialSmtpSettings,
  emailSettings: initialEmailSettings,
}: SettingsClientProps) {
  const [minAge, setMinAge] = useState(initialMinAge.toString())
  const [inactivityTimeout, setInactivityTimeout] = useState(initialInactivityTimeout.toString())
  const [confirmationTimeout, setConfirmationTimeout] = useState(initialConfirmationTimeout.toString())
  const [kioskPin, setKioskPin] = useState(initialKioskPin)

  // SMTP state hooks
  const [smtpHost, setSmtpHost] = useState(initialSmtpSettings.host)
  const [smtpPort, setSmtpPort] = useState(initialSmtpSettings.port.toString())
  const [smtpUser, setSmtpUser] = useState(initialSmtpSettings.user)
  const [smtpPassword, setSmtpPassword] = useState(initialSmtpSettings.password)
  const [smtpSecure, setSmtpSecure] = useState(initialSmtpSettings.secure)
  const [smtpFromName, setSmtpFromName] = useState(initialSmtpSettings.fromName)
  const [smtpFromEmail, setSmtpFromEmail] = useState(initialSmtpSettings.fromEmail)

  // Email template state hooks
  const [emailSubject, setEmailSubject] = useState(initialEmailSettings.subject)
  const [emailBody, setEmailBody] = useState(initialEmailSettings.body)

  const [activeTab, setActiveTab] = useState<'general' | 'smtp' | 'email'>('general')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      // Run saving actions sequentially or in parallel
      const [resAge, resInactivity, resConfirm, resPin, resSmtp, resEmail] = await Promise.all([
        saveAppSettings('min_age', parseInt(minAge, 10)),
        saveAppSettings('inactivity_timeout', parseInt(inactivityTimeout, 10)),
        saveAppSettings('confirmation_timeout', parseInt(confirmationTimeout, 10)),
        saveAppSettings('kiosk_pin', kioskPin.trim()),
        saveAppSettings('smtp_settings', {
          host: smtpHost.trim(),
          port: parseInt(smtpPort, 10) || 587,
          user: smtpUser.trim(),
          password: smtpPassword,
          secure: smtpSecure,
          fromName: smtpFromName.trim(),
          fromEmail: smtpFromEmail.trim() || smtpUser.trim(),
        }),
        saveAppSettings('email_settings', {
          subject: emailSubject.trim(),
          body: emailBody,
        }),
      ])

      if (resAge.error || resInactivity.error || resConfirm.error || resPin.error || resSmtp.error || resEmail.error) {
        setError(
          resAge.error || resInactivity.error || resConfirm.error || resPin.error || resSmtp.error || resEmail.error || 'Error al guardar configuraciones'
        )
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      setError('Error de comunicación: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Configuración del Sistema</h2>
        <p className="text-slate-500 text-sm mt-1">
          Ajuste los límites de edad legal, tiempos de espera del kiosco, servidores SMTP y plantillas de correo.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 border-b border-slate-200 pb-px mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'general'
              ? 'border-teal-800 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Kiosco y General
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('smtp')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'smtp'
              ? 'border-teal-800 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Configuración SMTP
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'email'
              ? 'border-teal-800 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Plantilla de Correo
        </button>
      </div>

      <div className="max-w-2xl bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-sm flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Configuraciones guardadas con éxito en el servidor.</span>
            </div>
          )}

          <div className="space-y-6">
            
            {activeTab === 'general' && (
              <>
                {/* Setting 1: Age of Consent */}
                <div className="flex flex-col md:flex-row gap-4 items-start justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                  <div className="space-y-1 max-w-md">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm md:text-base">
                      <ShieldCheck className="w-5 h-5 text-teal-800" />
                      Edad considerada menor de edad
                    </h4>
                    <p className="text-slate-400 text-xs md:text-sm">
                      Cualquier participante menor que esta edad requerirá obligatoriamente los datos y firma del tutor.
                    </p>
                  </div>
                  <div className="w-full md:w-32 shrink-0">
                    <input
                      type="number"
                      value={minAge}
                      onChange={(e) => setMinAge(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800 focus:bg-white focus:border-teal-700 outline-none text-base md:text-lg"
                    />
                  </div>
                </div>

                {/* Setting 2: Inactivity reset time */}
                <div className="flex flex-col md:flex-row gap-4 items-start justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                  <div className="space-y-1 max-w-md">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm md:text-base">
                      <Hourglass className="w-5 h-5 text-teal-800" />
                      Tiempo de inactividad (segundos)
                    </h4>
                    <p className="text-slate-400 text-xs md:text-sm">
                      Tiempo de espera sin tocar la pantalla antes de preguntar al usuario si continúa o de lo contrario borrar el formulario.
                    </p>
                  </div>
                  <div className="w-full md:w-32 shrink-0">
                    <input
                      type="number"
                      value={inactivityTimeout}
                      onChange={(e) => setInactivityTimeout(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800 focus:bg-white focus:border-teal-700 outline-none text-base md:text-lg"
                    />
                  </div>
                </div>

                {/* Setting 3: Screen confirmation redirect time */}
                <div className="flex flex-col md:flex-row gap-4 items-start justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                  <div className="space-y-1 max-w-md">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm md:text-base">
                      <Monitor className="w-5 h-5 text-teal-800" />
                      Tiempo de pantalla de confirmación (segundos)
                    </h4>
                    <p className="text-slate-400 text-xs md:text-sm">
                      Duración de la pantalla de éxito "Gracias" después de firmar y antes de reiniciar el formulario.
                    </p>
                  </div>
                  <div className="w-full md:w-32 shrink-0">
                    <input
                      type="number"
                      value={confirmationTimeout}
                      onChange={(e) => setConfirmationTimeout(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800 focus:bg-white focus:border-teal-700 outline-none text-base md:text-lg"
                    />
                  </div>
                </div>

                {/* Setting 4: Kiosk PIN */}
                <div className="flex flex-col md:flex-row gap-4 items-start justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                  <div className="space-y-1 max-w-md">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm md:text-base">
                      <ShieldCheck className="w-5 h-5 text-teal-800" />
                      PIN de Seguridad del Kiosco
                    </h4>
                    <p className="text-slate-400 text-xs md:text-sm">
                      Código de seguridad utilizado por el personal de AMA para desbloquear la selección de agencias.
                    </p>
                  </div>
                  <div className="w-full md:w-32 shrink-0">
                    <input
                      type="text"
                      maxLength={8}
                      value={kioskPin}
                      onChange={(e) => setKioskPin(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800 focus:bg-white focus:border-teal-700 outline-none text-base md:text-lg"
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'smtp' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Servidor SMTP (Host)</label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="e.g. smtp.gmail.com"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-teal-700 outline-none text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Puerto (Port)</label>
                    <input
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="587"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-teal-700 outline-none text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Usuario / Email</label>
                    <input
                      type="text"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="e.g. kiosk@arenal.com"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-teal-700 outline-none text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Contraseña</label>
                    <input
                      type="password"
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-teal-700 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nombre Remitente</label>
                    <input
                      type="text"
                      value={smtpFromName}
                      onChange={(e) => setSmtpFromName(e.target.value)}
                      placeholder="Arenal Mundo Aventura"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-teal-700 outline-none text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email Remitente (Opcional)</label>
                    <input
                      type="text"
                      value={smtpFromEmail}
                      onChange={(e) => setSmtpFromEmail(e.target.value)}
                      placeholder="e.g. no-reply@arenal.com"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-teal-700 outline-none text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="smtpSecure"
                    checked={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.checked)}
                    className="w-4 h-4 text-teal-800 border-slate-300 rounded focus:ring-teal-700 cursor-pointer"
                  />
                  <label htmlFor="smtpSecure" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    Usar Conexión Segura (SSL/TLS en puerto 465)
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Asunto del Correo / Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Su Waiver Firmado"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-teal-700 outline-none text-sm font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Mensaje / Body Template</label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={8}
                    placeholder="Escriba el cuerpo del correo aquí..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-teal-700 outline-none text-sm leading-relaxed"
                  />
                  <span className="text-xxs font-bold text-slate-400 block pt-1 uppercase">
                    Comodines soportados: <code className="text-teal-800 bg-teal-50 px-1 py-0.5 rounded font-mono font-bold text-xxs">{`{name}`}</code> (Nombre), <code className="text-teal-800 bg-teal-50 px-1 py-0.5 rounded font-mono font-bold text-xxs">{`{waiver_number}`}</code> (Código waiver)
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* Submit panel */}
          <div className="flex justify-end border-t border-slate-100 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-teal-800 hover:bg-teal-900 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm shadow-md cursor-pointer flex items-center gap-1.5 transition-all active:scale-98"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Guardar Configuración</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  )
}
