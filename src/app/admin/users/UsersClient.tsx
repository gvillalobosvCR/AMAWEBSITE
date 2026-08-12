'use client'

import { useState } from 'react'
import {
  createSystemUser,
  toggleUserStatus,
  resetUserPassword,
} from '@/app/actions/admin'
import { Plus, Check, ShieldAlert, KeyRound, Lock, ToggleLeft, ToggleRight, X, Mail, User } from 'lucide-react'

interface UserItem {
  id: string
  email: string
  fullName: string
  role: 'ADMIN' | 'KIOSK'
  active: boolean
}

interface UsersClientProps {
  initialUsers: UserItem[]
}

export default function UsersClient({ initialUsers }: UsersClientProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  
  // UI Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState<UserItem | null>(null)
  
  // Create Form states
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newRole, setNewRole] = useState<'ADMIN' | 'KIOSK'>('KIOSK')
  
  // Reset Form states
  const [resetPasswordVal, setResetPasswordVal] = useState('')
  
  // Submission flags
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const clearForm = () => {
    setNewEmail('')
    setNewPassword('')
    setNewFullName('')
    setNewRole('KIOSK')
    setError(null)
    setSuccessMsg(null)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || !newPassword || !newFullName) {
      setError('Por favor complete todos los campos.')
      return
    }
    setError(null)
    setSubmitting(true)

    const res = await createSystemUser({
      email: newEmail,
      password: newPassword,
      fullName: newFullName,
      role: newRole,
    })

    setSubmitting(false)
    if (res.error) {
      setError(res.error)
    } else {
      // Optimistic update or reload page
      // For simplicity, update local state
      const tempId = Math.random().toString() // placeholder
      setUsers([
        ...users,
        {
          id: tempId,
          email: newEmail,
          fullName: newFullName,
          role: newRole,
          active: true,
        },
      ])
      setShowCreateModal(false)
      clearForm()
      // Reload parent Server component to get fresh server uuid
      window.location.reload()
    }
  }

  const handleToggleStatus = async (item: UserItem) => {
    const updatedStatus = !item.active
    const res = await toggleUserStatus(item.id, updatedStatus)
    if (res.error) {
      alert(res.error)
    } else {
      // update state
      setUsers(
        users.map((u) => (u.id === item.id ? { ...u, active: updatedStatus } : u))
      )
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetPasswordVal) {
      setError('Escriba una contraseña nueva.')
      return
    }
    setError(null)
    setSubmitting(true)

    const res = await resetUserPassword(showResetModal!.id, resetPasswordVal)
    
    setSubmitting(false)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccessMsg('Contraseña restablecida con éxito.')
      setTimeout(() => {
        setShowResetModal(null)
        setResetPasswordVal('')
        setSuccessMsg(null)
      }, 1500)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Usuarios / Tablets</h2>
          <p className="text-slate-500 text-sm mt-1">
            Gestione las tablets de recepción, canopy y perfiles administrativos.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Crear Usuario</span>
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left divide-y divide-slate-100 text-sm">
            <thead>
              <tr className="bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Nombre / Tablet</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Rol / Nivel</th>
                <th className="px-6 py-4">Estado / Active</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {u.fullName}
                  </td>
                  <td className="px-6 py-4 font-mono">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xxs font-bold ${u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-teal-50 text-teal-700 border border-teal-100'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        u.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {u.active ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Activo</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" />
                          <span>Inactivo</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => setShowResetModal(u)}
                      className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all inline-flex items-center gap-1 text-xs cursor-pointer shadow-sm"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Clave</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateUser}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="bg-teal-900 text-white p-6 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold">Crear Nuevo Usuario</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false)
                  clearForm()
                }}
                className="p-2 hover:bg-teal-800 rounded-xl text-white/80 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-sm flex items-start gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nombre / Tablet Tag</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><User className="w-4 h-4" /></span>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Tablet Canopy 01"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-teal-700 transition-all text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Mail className="w-4 h-4" /></span>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="canopy01@arenal.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-teal-700 transition-all text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Contraseña</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Lock className="w-4 h-4" /></span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-teal-700 transition-all text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Rol</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-teal-700 transition-all text-sm text-slate-800 cursor-pointer"
                >
                  <option value="KIOSK">KIOSK (Solo para firmar waivers)</option>
                  <option value="ADMIN">ADMIN (Panel de control administrativo)</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false)
                  clearForm()
                }}
                className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors text-sm font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-teal-800 hover:bg-teal-900 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm shadow-md cursor-pointer flex items-center justify-center min-w-[120px]"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Crear'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleResetPassword}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="bg-teal-900 text-white p-6 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold">Cambiar Contraseña</h3>
                <p className="text-xxs text-emerald-400 mt-0.5">
                  Restablecer clave para: {showResetModal.fullName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(null)
                  setResetPasswordVal('')
                  setError(null)
                }}
                className="p-2 hover:bg-teal-800 rounded-xl text-white/80 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-sm flex items-start gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nueva Contraseña</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Lock className="w-4 h-4" /></span>
                  <input
                    type="password"
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-teal-700 transition-all text-sm text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(null)
                  setResetPasswordVal('')
                  setError(null)
                }}
                className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors text-sm font-semibold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-teal-800 hover:bg-teal-900 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm shadow-md cursor-pointer flex items-center justify-center min-w-[120px]"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Restablecer'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}
