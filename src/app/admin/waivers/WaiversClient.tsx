'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSignatureUrl } from '@/app/actions/waiver'
import { generateWaiverPDF } from '@/lib/pdf-generator'
import { Search, Eye, FileDown, X, ShieldAlert, Calendar, User, Baby, HelpCircle } from 'lucide-react'

interface WaiverItem {
  id: string
  waiver_number: string
  full_name: string
  id_passport: string
  age: number
  language: 'es' | 'en'
  exact_content: string
  signature_path: string
  tablet_user_id: string
  is_minor: boolean
  created_at: string
  profiles?: { full_name: string | null } | null
  guardian_information?: {
    guardian_name: string
    guardian_id_passport: string
    relationship: string
    guardian_signature_path: string
  } | null
}

interface WaiversClientProps {
  waivers: any[]
  totalCount: number
  profiles: { id: string; full_name: string | null }[]
  currentFilters: {
    search: string
    lang: string
    ageGroup: string
    tablet: string
    date: string
  }
}

export default function WaiversClient({
  waivers,
  totalCount,
  profiles,
  currentFilters,
}: WaiversClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filter local state
  const [search, setSearch] = useState(currentFilters.search)
  const [lang, setLang] = useState(currentFilters.lang)
  const [ageGroup, setAgeGroup] = useState(currentFilters.ageGroup)
  const [tablet, setTablet] = useState(currentFilters.tablet)
  const [date, setDate] = useState(currentFilters.date)

  // Selected waiver details modal state
  const [selectedWaiver, setSelectedWaiver] = useState<WaiverItem | null>(null)
  const [signedSigUrl, setSignedSigUrl] = useState<string | null>(null)
  const [signedGuardUrl, setSignedGuardUrl] = useState<string | null>(null)
  const [loadingUrls, setLoadingUrls] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  // Load signatures when opening details modal
  useEffect(() => {
    if (selectedWaiver) {
      setLoadingUrls(true)
      Promise.all([
        getSignatureUrl(selectedWaiver.signature_path),
        selectedWaiver.guardian_information?.guardian_signature_path
          ? getSignatureUrl(selectedWaiver.guardian_information.guardian_signature_path)
          : Promise.resolve(null),
      ]).then(([sigUrl, guardUrl]) => {
        setSignedSigUrl(sigUrl)
        setSignedGuardUrl(guardUrl)
        setLoadingUrls(false)
      })
    } else {
      setSignedSigUrl(null)
      setSignedGuardUrl(null)
    }
  }, [selectedWaiver])

  // Apply filters to route query params
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search)
    if (lang) params.set('lang', lang)
    if (ageGroup) params.set('ageGroup', ageGroup)
    if (tablet) params.set('tablet', tablet)
    if (date) params.set('date', date)

    router.push(`/admin/waivers?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setSearch('')
    setLang('')
    setAgeGroup('')
    setTablet('')
    setDate('')
    router.push('/admin/waivers')
  }

  const handleDownloadPDF = async (w: WaiverItem) => {
    if (!signedSigUrl) return
    setGeneratingPDF(true)
    try {
      await generateWaiverPDF({
        waiverNumber: w.waiver_number,
        fullName: w.full_name,
        idPassport: w.id_passport,
        age: w.age,
        language: w.language,
        exactContent: w.exact_content,
        createdAt: w.created_at,
        version: w.guardian_information ? '1.0 (Minor)' : '1.0', // can adapt version field
        signatureUrl: signedSigUrl,
        isMinor: w.is_minor,
        guardianName: w.guardian_information?.guardian_name,
        guardianIdPassport: w.guardian_information?.guardian_id_passport,
        relationship: w.guardian_information?.relationship,
        guardianSignatureUrl: signedGuardUrl || undefined,
      })
    } catch (err) {
      console.error(err)
      alert('Error al generar PDF / Error generating PDF')
    } finally {
      setGeneratingPDF(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Descargos / Waivers</h2>
        <p className="text-slate-500 text-sm">
          Busque, filtre y consulte descargos históricos firmados en las tablets.
        </p>
      </div>

      {/* Filters Form */}
      <form onSubmit={handleSearchSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Text search */}
          <div className="md:col-span-4 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Nombre, ID o Código..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-700 outline-none transition-all"
            />
          </div>

          {/* Lang select */}
          <div className="md:col-span-2">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-700 outline-none transition-all cursor-pointer"
            >
              <option value="">Idioma / Language (Todos)</option>
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Age select */}
          <div className="md:col-span-2">
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-700 outline-none transition-all cursor-pointer"
            >
              <option value="">Edad / Category (Todos)</option>
              <option value="adult">Adultos (&gt;= 18)</option>
              <option value="minor">Menores (&lt; 18)</option>
            </select>
          </div>

          {/* Tablet select */}
          <div className="md:col-span-2">
            <select
              value={tablet}
              onChange={(e) => setTablet(e.target.value)}
              className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-700 outline-none transition-all cursor-pointer"
            >
              <option value="">Tablet / User (Todos)</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || 'Sin nombre'}
                </option>
              ))}
            </select>
          </div>

          {/* Date select */}
          <div className="md:col-span-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-700 outline-none transition-all cursor-pointer"
            />
          </div>

        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Limpiar filtros
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-sm font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-md cursor-pointer"
          >
            Buscar / Filter
          </button>
        </div>
      </form>

      {/* Grid of total found */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>Mostrando <span className="font-semibold text-slate-800">{waivers.length}</span> de <span className="font-semibold text-slate-800">{totalCount}</span> descargos firmados.</span>
      </div>

      {/* Waivers list */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left divide-y divide-slate-100 text-sm">
            <thead>
              <tr className="bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Código / Waiver</th>
                <th className="px-6 py-4">Nombre / Name</th>
                <th className="px-6 py-4">Identificación</th>
                <th className="px-6 py-4">Edad</th>
                <th className="px-6 py-4">Idioma</th>
                <th className="px-6 py-4">Tablet / Registrador</th>
                <th className="px-6 py-4">Fecha / Hora</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {waivers.length > 0 ? (
                waivers.map((w) => {
                  const dateObj = new Date(w.created_at)
                  return (
                    <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-teal-800">
                        {w.waiver_number}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {w.full_name}
                      </td>
                      <td className="px-6 py-4 font-mono">{w.id_passport}</td>
                      <td className="px-6 py-4">
                        {w.age} {w.is_minor && <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full ml-1 uppercase">Menor</span>}
                      </td>
                      <td className="px-6 py-4 uppercase">
                        <span className={`px-2 py-0.5 rounded-full text-xxs font-bold ${w.language === 'es' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-teal-50 text-teal-600 border border-teal-100'}`}>
                          {w.language}
                        </span>
                      </td>
                      <td className="px-6 py-4 truncate max-w-[150px]">
                        {w.profiles?.full_name || 'Tablet Kiosk'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {dateObj.toLocaleDateString('es-CR')} {dateObj.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedWaiver(w)}
                          className="p-2 text-teal-700 hover:text-white hover:bg-teal-800 border border-teal-100 hover:border-teal-800 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                    No se encontraron descargos con los criterios de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL VIEW MODAL */}
      {selectedWaiver && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-teal-900 text-white p-6 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold font-mono tracking-wider">
                  {selectedWaiver.waiver_number}
                </h3>
                <p className="text-xs text-emerald-400 mt-0.5">
                  Waiver Histórico de Cliente (Inmutable)
                </p>
              </div>
              <button
                onClick={() => setSelectedWaiver(null)}
                className="p-2 hover:bg-teal-800 rounded-xl text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 text-slate-700 text-sm leading-relaxed">
              
              {/* Meta information row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="space-y-2">
                  <span className="text-xxs font-bold text-slate-400 block uppercase tracking-wider">Detalles del Participante</span>
                  <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400 shrink-0" /><span className="font-bold text-slate-800">{selectedWaiver.full_name}</span></div>
                  <div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" /><span>ID: <span className="font-semibold">{selectedWaiver.id_passport}</span></span></div>
                  <div className="flex items-center gap-2"><Baby className="w-4 h-4 text-slate-400 shrink-0" /><span>Edad: <span className="font-semibold">{selectedWaiver.age} años</span></span></div>
                </div>

                <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                  <span className="text-xxs font-bold text-slate-400 block uppercase tracking-wider">Detalles del Registro</span>
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400 shrink-0" /><span>Fecha: <span className="font-semibold">{new Date(selectedWaiver.created_at).toLocaleString('es-CR')}</span></span></div>
                  <div className="flex items-center gap-2"><HelpCircle className="w-4 h-4 text-slate-400 shrink-0" /><span>Idioma: <span className="font-semibold uppercase">{selectedWaiver.language}</span></span></div>
                  <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400 shrink-0" /><span>Tablet: <span className="font-semibold">{selectedWaiver.profiles?.full_name || 'Kiosk'}</span></span></div>
                </div>
              </div>

              {/* Minor Guardian Info Card */}
              {selectedWaiver.is_minor && selectedWaiver.guardian_information && (
                <div className="border border-amber-200 bg-amber-50/30 rounded-2xl p-5 space-y-3">
                  <h4 className="text-amber-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Baby className="w-4 h-4 text-amber-700" />
                    Responsable Legal / Guardian
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-700">
                    <div>Nombre: <span className="font-bold text-slate-800">{selectedWaiver.guardian_information.guardian_name}</span></div>
                    <div>Cédula/Passport: <span className="font-semibold">{selectedWaiver.guardian_information.guardian_id_passport}</span></div>
                    <div>Relación: <span className="font-semibold">{selectedWaiver.guardian_information.relationship}</span></div>
                  </div>
                </div>
              )}

              {/* Exact Accepted Text Scroll box */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Texto Exacto Aceptado por el Cliente:</span>
                <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl max-h-48 overflow-y-auto whitespace-pre-line text-slate-600 text-xs">
                  {selectedWaiver.exact_content}
                </div>
              </div>

              {/* Graphical Signatures */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Firmas Gráficas Registradas:</span>
                
                {loadingUrls ? (
                  <div className="flex items-center justify-center p-6 text-slate-400 text-xs gap-2">
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    <span>Cargando firmas seguras...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer signature */}
                    <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 flex flex-col items-center">
                      {signedSigUrl ? (
                        <img src={signedSigUrl} alt="Firma del cliente" className="h-20 object-contain" />
                      ) : (
                        <span className="text-rose-500 text-xs italic">Firma no disponible</span>
                      )}
                      <span className="text-[10px] text-slate-400 font-semibold uppercase mt-3">Firma del Participante</span>
                    </div>

                    {/* Guardian signature */}
                    {selectedWaiver.is_minor && (
                      <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 flex flex-col items-center">
                        {signedGuardUrl ? (
                          <img src={signedGuardUrl} alt="Firma del tutor" className="h-20 object-contain" />
                        ) : (
                          <span className="text-rose-500 text-xs italic">Firma de tutor no disponible</span>
                        )}
                        <span className="text-[10px] text-slate-400 font-semibold uppercase mt-3">Firma del Responsable</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedWaiver(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleDownloadPDF(selectedWaiver)}
                disabled={loadingUrls || generatingPDF || !signedSigUrl}
                className="px-6 py-2 bg-teal-800 hover:bg-teal-900 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                {generatingPDF ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                <span>Generar PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
