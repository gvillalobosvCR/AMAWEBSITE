'use client'

import { useState } from 'react'
import { publishWaiverVersion } from '@/app/actions/admin'
import { BookOpen, HelpCircle, Save, ShieldAlert, Check, Calendar } from 'lucide-react'

interface VersionItem {
  id: string
  version: string
  title_es: string
  is_active: boolean
  created_at: string
}

interface VersionsClientProps {
  activeVersion: {
    version: string
    title_es: string
    title_en: string
    content_es: string
    content_en: string
  }
  allVersions: VersionItem[]
}

export default function VersionsClient({ activeVersion, allVersions }: VersionsClientProps) {
  const [version, setVersion] = useState('')
  const [titleEs, setTitleEs] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [contentEs, setContentEs] = useState('')
  const [contentEn, setContentEn] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!version || !titleEs || !titleEn || !contentEs || !contentEn) {
      setError('Por favor complete todos los campos de la nueva versión.')
      return
    }
    setError(null)
    setSubmitting(true)

    const res = await publishWaiverVersion({
      version,
      titleEs,
      titleEn,
      contentEs,
      contentEn,
    })

    setSubmitting(false)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Texto del Waiver / Versiones</h2>
        <p className="text-slate-500 text-sm mt-1">
          Administre el texto legal del descargo de responsabilidad en Español e Inglés.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Current Active Version View */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Versión Activa</h3>
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold uppercase border border-emerald-200">
                Versión {activeVersion.version}
              </span>
            </div>

            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Título (ES)</span>
                <p className="font-bold text-slate-800">{activeVersion.title_es}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Contenido (ES)</span>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl max-h-36 overflow-y-auto whitespace-pre-line text-xs">
                  {activeVersion.content_es}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100" />

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Title (EN)</span>
                <p className="font-bold text-slate-800">{activeVersion.title_en}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Content (EN)</span>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl max-h-36 overflow-y-auto whitespace-pre-line text-xs">
                  {activeVersion.content_en}
                </div>
              </div>
            </div>
          </div>

          {/* Historial of Versions list */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Historial de Versiones</h3>
            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {allVersions.map((v) => (
                <div
                  key={v.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    v.is_active
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">v{v.version}</span>
                      {v.is_active && (
                        <span className="bg-emerald-500 text-white font-extrabold px-1 rounded text-[8px] uppercase">
                          ACTIVO
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 font-medium block truncate max-w-[150px]">{v.title_es}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(v.created_at).toLocaleDateString('es-CR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Form to create and publish a new version */}
        <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Publicar Nueva Versión</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-sm flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Nueva versión publicada con éxito. Recargando...</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Identificador de Versión (e.g. 1.1 o 2.0)</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 1.1"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-teal-700 transition-all text-sm text-slate-800 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Título en Español</label>
                <input
                  type="text"
                  value={titleEs}
                  onChange={(e) => setTitleEs(e.target.value)}
                  placeholder="e.g. Descargo de Responsabilidad"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-teal-700 transition-all text-sm text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Title in English</label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. Liability Waiver and Release"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-teal-700 transition-all text-sm text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Contenido del Descargo (Español)</label>
              <textarea
                value={contentEs}
                onChange={(e) => setContentEs(e.target.value)}
                placeholder="Escriba aquí los términos y condiciones completos en español..."
                rows={6}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-teal-700 transition-all text-sm text-slate-800 resize-y leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Waiver Content (English)</label>
              <textarea
                value={contentEn}
                onChange={(e) => setContentEn(e.target.value)}
                placeholder="Write the full english waiver terms and conditions here..."
                rows={6}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-teal-700 transition-all text-sm text-slate-800 resize-y leading-relaxed"
              />
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-teal-800 hover:bg-teal-900 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm shadow-md cursor-pointer flex items-center gap-1.5 transition-all active:scale-98"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Publicar Nueva Versión</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
