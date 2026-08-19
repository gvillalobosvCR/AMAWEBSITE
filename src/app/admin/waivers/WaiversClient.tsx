'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSignatureUrl } from '@/app/actions/waiver'
import { generateWaiverPDF } from '@/lib/pdf-generator'
import { Search, Eye, FileDown, X, ShieldAlert, Calendar, User, Baby, HelpCircle, Mail } from 'lucide-react'
import { formatDateTimeUTC } from '@/lib/date-utils'

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
  agencies?: { name: string } | null
  email?: string | null
}

interface WaiversClientProps {
  waivers: any[]
  totalCount: number
  profiles: { id: string; full_name: string | null }[]
  agencies: { id: string; name: string }[]
  currentPage: number
  pageSize: number
  currentFilters: {
    search: string
    lang: string
    ageGroup: string
    tablet: string
    startDate: string
    endDate: string
    agency: string
  }
}

export default function WaiversClient({
  waivers,
  totalCount,
  profiles,
  agencies,
  currentPage,
  pageSize,
  currentFilters,
}: WaiversClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filter local state
  const [search, setSearch] = useState(currentFilters.search)
  const [lang, setLang] = useState(currentFilters.lang)
  const [ageGroup, setAgeGroup] = useState(currentFilters.ageGroup)
  const [tablet, setTablet] = useState(currentFilters.tablet)
  const [startDate, setStartDate] = useState(currentFilters.startDate)
  const [endDate, setEndDate] = useState(currentFilters.endDate)
  const [agency, setAgency] = useState(currentFilters.agency)
  const [exporting, setExporting] = useState(false)
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null)

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

  // Apply filters to route query params (resets page to 1)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search)
    if (lang) params.set('lang', lang)
    if (ageGroup) params.set('ageGroup', ageGroup)
    if (tablet) params.set('tablet', tablet)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (agency) params.set('agency', agency)
    params.set('page', '1')

    router.push(`/admin/waivers?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setSearch('')
    setLang('')
    setAgeGroup('')
    setTablet('')
    setStartDate('')
    setEndDate('')
    setAgency('')
    router.push('/admin/waivers')
  }

  const handleExportCSV = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      let query = supabase
        .from('waivers')
        .select(`
          waiver_number,
          full_name,
          id_passport,
          email,
          age,
          is_minor,
          language,
          created_at,
          profiles (full_name),
          agencies (name)
        `)
        .order('created_at', { ascending: false })

      // Apply current search and filter states
      if (search.trim()) {
        query = query.or(`waiver_number.ilike.%${search}%,full_name.ilike.%${search}%,id_passport.ilike.%${search}%`)
      }
      if (lang) {
        query = query.eq('language', lang)
      }
      if (ageGroup) {
        if (ageGroup === 'minor') {
          query = query.eq('is_minor', true)
        } else if (ageGroup === 'adult') {
          query = query.eq('is_minor', false)
        }
      }
      if (tablet) {
        query = query.eq('tablet_user_id', tablet)
      }
      if (agency) {
        query = query.eq('agency_id', agency)
      }
      if (startDate) {
        const startUTC = new Date(startDate + 'T00:00:00')
        startUTC.setHours(startUTC.getHours() + 6)
        query = query.gte('created_at', startUTC.toISOString())
      }
      if (endDate) {
        const endUTC = new Date(endDate + 'T23:59:59')
        endUTC.setHours(endUTC.getHours() + 6)
        query = query.lte('created_at', endUTC.toISOString())
      }

      const { data: exportData, error } = await query
      if (error) {
        alert('Error al exportar: ' + error.message)
        return
      }

      if (!exportData || exportData.length === 0) {
        alert('No hay datos para exportar.')
        return
      }

      // CSV headers
      const headers = [
        'Código de Waiver / Waiver Code',
        'Nombre Completo / Full Name',
        'Identificación / Passport ID',
        'Correo Electrónico / Email',
        'Edad / Age',
        'Menor de Edad / Minor',
        'Idioma / Language',
        'Agencia / Agency',
        'Registrador / Tablet User',
        'Fecha y Hora / Date & Time',
      ]
      
      // CSV rows mapping
      const rows = exportData.map((item) => {
        const w = item as any
        return [
          w.waiver_number,
          `"${w.full_name?.replace(/"/g, '""') || ''}"`,
          `"${w.id_passport?.replace(/"/g, '""') || ''}"`,
          w.email ? `"${w.email.replace(/"/g, '""')}"` : 'N/A',
          w.age,
          w.is_minor ? 'Sí / Yes' : 'No',
          w.language?.toUpperCase() || '',
          w.agencies?.name ? `"${w.agencies.name.replace(/"/g, '""')}"` : 'N/A',
          w.profiles?.full_name ? `"${w.profiles.full_name.replace(/"/g, '""')}"` : 'Kiosk',
          `"${formatDateTimeUTC(w.created_at)}"`
        ]
      })
      
      // Create CSV string using semicolon (;) as separator for native Spanish Excel compatibility
      const csvContent = [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n')
      
      // Add UTF-8 BOM to prevent Excel display issues with accents
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      
      const dateStr = new Date().toISOString().split('T')[0]
      link.setAttribute('download', `AMA_Descargos_${dateStr}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err: any) {
      console.error(err)
      alert('Error al realizar la exportación: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('page', newPage.toString())
    router.push(`/admin/waivers?${params.toString()}`)
  }

  const handleSendEmailDirectly = async (w: WaiverItem) => {
    let targetEmail = w.email?.trim() || ''
    
    if (!targetEmail) {
      const promptedEmail = prompt('Este waiver no tiene un correo electrónico registrado. Ingrese el correo electrónico del destinatario: / This waiver does not have a registered email. Enter the recipient\'s email:')
      if (!promptedEmail || !promptedEmail.trim()) {
        return
      }
      targetEmail = promptedEmail.trim()
    }
    
    setSendingEmailId(w.id)
    try {
      // 1. Fetch signature URLs first
      const sigUrl = await getSignatureUrl(w.signature_path)
      if (!sigUrl) {
        alert('Error al obtener URL de firma / Error getting signature URL')
        return
      }
      
      let guardSigUrl: string | undefined = undefined
      if (w.is_minor && w.guardian_information?.guardian_signature_path) {
        const guardUrl = await getSignatureUrl(w.guardian_information.guardian_signature_path)
        if (guardUrl) {
          guardSigUrl = guardUrl
        }
      }

      // 2. Generate PDF in background (shouldDownload = false)
      const pdfDoc = await generateWaiverPDF({
        waiverNumber: w.waiver_number,
        fullName: w.full_name,
        idPassport: w.id_passport,
        age: w.age,
        language: w.language,
        exactContent: w.exact_content,
        createdAt: w.created_at,
        email: targetEmail,
        version: w.guardian_information ? '1.0 (Minor)' : '1.0',
        signatureUrl: sigUrl,
        isMinor: w.is_minor,
        guardianName: w.guardian_information?.guardian_name,
        guardianIdPassport: w.guardian_information?.guardian_id_passport,
        relationship: w.guardian_information?.relationship,
        guardianSignatureUrl: guardSigUrl,
      }, false)

      const pdfBase64 = pdfDoc.output('datauristring').split(',')[1]

      // 3. Send email via server action
      const { sendWaiverEmail } = await import('@/app/actions/email')
      const emailRes = await sendWaiverEmail({
        email: targetEmail,
        fullName: w.full_name,
        waiverNumber: w.waiver_number,
        pdfBase64
      })

      if (emailRes.error) {
        alert(emailRes.error)
      } else {
        alert(`Correo enviado con éxito a ${targetEmail} / Email successfully sent to ${targetEmail}`)
      }
    } catch (err: any) {
      console.error(err)
      alert('Error al enviar correo: ' + err.message)
    } finally {
      setSendingEmailId(null)
    }
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
        email: w.email || undefined,
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
          <div className="md:col-span-3 relative">
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

          {/* Agency select */}
          <div className="md:col-span-3">
            <select
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-700 outline-none transition-all cursor-pointer"
            >
              <option value="">Agencia / Agency (Todas)</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
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

          {/* Lang select */}
          <div className="md:col-span-2">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-700 outline-none transition-all cursor-pointer"
            >
              <option value="">Idioma / Lang (Todos)</option>
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Date range start */}
          <div className="md:col-span-3 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">Fecha Inicio / Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-700 outline-none transition-all cursor-pointer"
            />
          </div>

          {/* Date range end */}
          <div className="md:col-span-3 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">Fecha Fin / End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-700 outline-none transition-all cursor-pointer"
            />
          </div>

          {/* Spacer/Empty */}
          <div className="md:col-span-6" />

        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-slate-100 mt-2">
          {/* Export to Excel action button */}
          <button
            type="button"
            disabled={exporting}
            onClick={handleExportCSV}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <FileDown className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{exporting ? 'Exportando... / Exporting...' : 'Exportar Excel / CSV'}</span>
          </button>
          
          <div className="flex w-full sm:w-auto gap-3 justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-5 py-2.5 text-sm font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Limpiar filtros
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-md cursor-pointer"
            >
              Buscar / Filter
            </button>
          </div>
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
                        <div>{w.full_name}</div>
                        {w.agencies?.name && (
                          <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-100 font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block uppercase">
                            🏢 {w.agencies.name}
                          </span>
                        )}
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
                        {formatDateTimeUTC(w.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedWaiver(w)}
                            className="p-2 text-teal-700 hover:text-white hover:bg-teal-800 border border-teal-100 hover:border-teal-800 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold shadow-sm"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Ver</span>
                          </button>
                          
                          <button
                            disabled={sendingEmailId !== null}
                            onClick={() => handleSendEmailDirectly(w)}
                            className={`p-2 text-xs font-bold border rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm ${
                              sendingEmailId === w.id
                                ? 'bg-amber-50 border-amber-200 text-amber-800 cursor-not-allowed'
                                : 'bg-white text-emerald-800 border-emerald-100 hover:bg-emerald-800 hover:text-white hover:border-emerald-800'
                            }`}
                          >
                            {sendingEmailId === w.id ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-amber-800 border-t-transparent rounded-full animate-spin shrink-0" />
                                <span>Enviando...</span>
                              </>
                            ) : (
                              <>
                                <Mail className="w-4 h-4 shrink-0" />
                                <span>Enviar Email</span>
                              </>
                            )}
                          </button>
                        </div>
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

      {/* Pagination Controls */}
      {(() => {
        const totalPages = Math.ceil(totalCount / pageSize)
        return totalPages > 1 ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-4 border border-slate-100 rounded-2xl shadow-sm mt-4">
            <span className="text-sm text-slate-500">
              Página <span className="font-semibold text-slate-800">{currentPage}</span> de <span className="font-semibold text-slate-800">{totalPages}</span> (Mostrando {waivers.length} de {totalCount} descargos)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white text-slate-600 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Anterior / Previous
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white text-slate-600 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Siguiente / Next
              </button>
            </div>
          </div>
        ) : null
      })()}

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
                  {selectedWaiver.agencies?.name && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs shrink-0">🏢</span>
                      <span>Agencia: <span className="font-bold text-teal-800">{selectedWaiver.agencies.name}</span></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" /><span>ID: <span className="font-semibold">{selectedWaiver.id_passport}</span></span></div>
                  <div className="flex items-center gap-2"><Baby className="w-4 h-4 text-slate-400 shrink-0" /><span>Edad: <span className="font-semibold">{selectedWaiver.age} años</span></span></div>
                  {selectedWaiver.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Email: <span className="font-semibold text-slate-700">{selectedWaiver.email}</span></span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                  <span className="text-xxs font-bold text-slate-400 block uppercase tracking-wider">Detalles del Registro</span>
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400 shrink-0" /><span>Fecha: <span className="font-semibold">{formatDateTimeUTC(selectedWaiver.created_at)}</span></span></div>
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
                onClick={() => handleSendEmailDirectly(selectedWaiver)}
                disabled={loadingUrls || sendingEmailId !== null || !signedSigUrl}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                {sendingEmailId === selectedWaiver.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                <span>Enviar por Correo</span>
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
