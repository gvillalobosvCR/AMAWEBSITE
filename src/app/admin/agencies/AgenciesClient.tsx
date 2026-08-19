'use client'

import { useState } from 'react'
import { createAgency, deleteAgency } from '@/app/actions/admin'
import { Search, Plus, Trash2, Building2, X, AlertTriangle, Check } from 'lucide-react'

interface AgencyItem {
  id: string
  name: string
  created_at: string
}

interface AgenciesClientProps {
  initialAgencies: AgencyItem[]
}

export default function AgenciesClient({ initialAgencies }: AgenciesClientProps) {
  const [agencies, setAgencies] = useState<AgencyItem[]>(initialAgencies)
  const [search, setSearch] = useState('')
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAgencyName, setNewAgencyName] = useState('')
  const [agencyToDelete, setAgencyToDelete] = useState<AgencyItem | null>(null)
  
  // Status feedback states
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Local search filter
  const filteredAgencies = agencies.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddAgency = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAgencyName.trim()) return

    setActionError(null)
    setActionSuccess(null)
    setSubmitting(true)

    const res = await createAgency(newAgencyName.trim())
    setSubmitting(false)

    if (res.error) {
      setActionError(res.error)
    } else {
      // Local state update
      const tempNewAgency: AgencyItem = {
        id: crypto.randomUUID(), // temp id for instant render
        name: newAgencyName.trim(),
        created_at: new Date().toISOString(),
      }
      setAgencies((prev) => [tempNewAgency, ...prev].sort((a, b) => a.name.localeCompare(b.name)))
      setNewAgencyName('')
      setShowAddModal(false)
      setActionSuccess('Agencia agregada con éxito.')
      
      // Auto clear success message
      setTimeout(() => setActionSuccess(null), 3000)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!agencyToDelete) return

    setActionError(null)
    setActionSuccess(null)
    setSubmitting(true)

    const res = await deleteAgency(agencyToDelete.id)
    setSubmitting(false)

    if (res.error) {
      setActionError(res.error)
    } else {
      setAgencies((prev) => prev.filter((a) => a.id !== agencyToDelete.id))
      setActionSuccess(`Agencia "${agencyToDelete.name}" eliminada correctamente.`)
      setAgencyToDelete(null)
      
      setTimeout(() => setActionSuccess(null), 3000)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Gestión de Agencias</h2>
          <p className="text-slate-500 text-sm">
            Administre las agencias turísticas asociadas al descargo de responsabilidad.
          </p>
        </div>
        <button
          onClick={() => {
            setActionError(null)
            setShowAddModal(true)
          }}
          className="px-5 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Agencia</span>
        </button>
      </div>

      {/* Success and Error Alerts */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm flex items-center gap-2 shadow-sm animate-in slide-in-from-top-2">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-sm flex items-start gap-2 shadow-sm animate-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Search Bar Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar agencia por nombre..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-700 outline-none transition-all"
          />
        </div>
        <div className="text-slate-400 text-xs md:ml-auto">
          Total: <span className="font-semibold text-slate-700">{filteredAgencies.length}</span> agencias encontradas.
        </div>
      </div>

      {/* Agencies Grid / List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left divide-y divide-slate-100 text-sm">
            <thead>
              <tr className="bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4 w-12 text-center">Icono</th>
                <th className="px-6 py-4">Nombre de la Agencia</th>
                <th className="px-6 py-4">Fecha de Creación</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredAgencies.length > 0 ? (
                filteredAgencies.map((agency) => {
                  const dateObj = new Date(agency.created_at)
                  return (
                    <tr key={agency.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 text-center">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center mx-auto">
                          <Building2 className="w-4 h-4" />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 text-base">
                        {agency.name}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {isNaN(dateObj.getTime())
                          ? 'Recién agregada'
                          : `${dateObj.toLocaleDateString('es-CR')} ${dateObj.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}`}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setAgencyToDelete(agency)}
                          className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-100 hover:border-rose-600 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                    No se encontraron agencias de turismo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD AGENCY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-teal-900 text-white p-6 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                Registrar Nueva Agencia
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-teal-800 rounded-xl text-white/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddAgency}>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Nombre de la Agencia *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAgencyName}
                    onChange={(e) => setNewAgencyName(e.target.value)}
                    placeholder="Ej. Costa Rica Expeditions"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-700 outline-none text-base transition-all"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newAgencyName.trim()}
                  className="px-6 py-2 bg-teal-800 hover:bg-teal-900 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Guardar Agencia</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {agencyToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 p-6 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl">
              ⚠️
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                ¿Eliminar esta agencia?
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Está a punto de eliminar la agencia <span className="font-semibold text-slate-800">"{agencyToDelete.name}"</span>. Esta acción no se puede deshacer. Los waivers que ya hagan referencia a ella mantendrán sus registros sin cambios.
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setAgencyToDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="px-6 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Sí, Eliminar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
