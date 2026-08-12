'use client'

import { useState } from 'react'
import { saveAppSettings } from '@/app/actions/admin'
import { Save, ShieldAlert, Check, Settings, ShieldCheck, Hourglass, Monitor } from 'lucide-react'

interface SettingsClientProps {
  minAge: number
  inactivityTimeout: number
  confirmationTimeout: number
}

export default function SettingsClient({
  minAge: initialMinAge,
  inactivityTimeout: initialInactivityTimeout,
  confirmationTimeout: initialConfirmationTimeout,
}: SettingsClientProps) {
  const [minAge, setMinAge] = useState(initialMinAge.toString())
  const [inactivityTimeout, setInactivityTimeout] = useState(initialInactivityTimeout.toString())
  const [confirmationTimeout, setConfirmationTimeout] = useState(initialConfirmationTimeout.toString())

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
      const [resAge, resInactivity, resConfirm] = await Promise.all([
        saveAppSettings('min_age', parseInt(minAge, 10)),
        saveAppSettings('inactivity_timeout', parseInt(inactivityTimeout, 10)),
        saveAppSettings('confirmation_timeout', parseInt(confirmationTimeout, 10)),
      ])

      if (resAge.error || resInactivity.error || resConfirm.error) {
        setError(
          resAge.error || resInactivity.error || resConfirm.error || 'Error al guardar configuraciones'
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
          Ajuste los límites de edad legal, tiempos de espera del kiosco y comportamientos generales.
        </p>
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
            
            {/* Setting 1: Age of Consent */}
            <div className="flex flex-col md:flex-row gap-4 items-start justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
              <div className="space-y-1 max-w-md">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm md:text-base">
                  <ShieldCheck className="w-5 h-5 text-teal-800" />
                  Edad considerada menor de edad
                </h4>
                <p className="text-slate-400 text-xs md:text-sm">
                  Cualquier participante menor que esta edad requerirá obligatoriamente los datos y firma del padre o tutor.
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
                  Duración de la pantalla de éxito "Gracias" después de firmar y antes de regresar a la pantalla de idiomas.
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
