'use client'

import { useActionState, startTransition } from 'react'
import { login } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import { ShieldAlert, Lock, User } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await login(prevState, formData)
      if (res.success) {
        if (res.role === 'ADMIN') {
          router.push('/admin/dashboard')
        } else {
          router.push('/kiosk')
        }
        return { success: true }
      }
      return { error: res.error }
    },
    null
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Forest-Adventure Background Waves */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-teal-800/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-700/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10 relative z-10">
        <div className="flex flex-col items-center mb-8">
          {/* Logo matching Arenal Mundo Aventura */}
          <div className="flex flex-col items-center mb-3">
            <img src="/logo.png" alt="Arenal Mundo Aventura" className="h-16 w-auto" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Control de Acceso / Tablet Login
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1 text-center">
            Ingrese credenciales autorizadas para activar el Kiosco
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {state?.error && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 block">
              Correo Electrónico / Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <User className="w-5 h-5" />
              </span>
              <input
                type="email"
                name="email"
                required
                disabled={isPending}
                placeholder="ejemplo@arenal.com"
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-100 transition-all text-base md:text-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 block">
              Contraseña / Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                name="password"
                required
                disabled={isPending}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-100 transition-all text-base md:text-lg"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 bg-teal-800 hover:bg-teal-900 text-white font-bold text-lg rounded-2xl shadow-lg shadow-teal-900/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
          >
            {isPending ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'INICIAR SESIÓN / LOGIN'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
