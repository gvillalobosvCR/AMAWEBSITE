'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { logOut } from '@/app/actions/auth'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  BookOpen,
  LogOut,
  Menu,
  X,
  UserCheck,
} from 'lucide-react'

interface AdminLayoutClientProps {
  userProfile: {
    full_name: string | null
    role: string
  }
  children: React.ReactNode
}

export default function AdminLayoutClient({ userProfile, children }: AdminLayoutClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Waivers / Descargos', path: '/admin/waivers', icon: FileText },
    { name: 'Usuarios', path: '/admin/users', icon: Users },
    { name: 'Texto del Waiver', path: '/admin/versions', icon: BookOpen },
    { name: 'Configuración', path: '/admin/settings', icon: Settings },
  ]

  const handleLogout = async () => {
    await logOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800 font-sans">
      
      {/* Mobile Top Navbar */}
      <header className="bg-teal-900 text-white p-4 flex items-center justify-between md:hidden shadow-md shrink-0">
        <div className="flex flex-col">
          <span className="text-xl font-bold font-serif leading-none">Arenal</span>
          <span className="text-[8px] uppercase tracking-widest text-emerald-400 font-bold -mt-0.5">
            Mundo Aventura
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed inset-y-0 left-0 bg-teal-950 text-slate-200 w-64 z-30 md:relative md:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col shadow-2xl shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Branding header */}
        <div className="p-6 border-b border-teal-900 bg-teal-900/20 hidden md:block">
          <h2 className="text-2xl font-extrabold text-white font-serif leading-none">
            Arenal
          </h2>
          <p className="text-[9px] tracking-widest text-emerald-400 font-bold uppercase mt-0.5">
            Mundo Aventura
          </p>
        </div>

        {/* User Info Capsule */}
        <div className="p-6 border-b border-teal-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow-inner">
            {userProfile.full_name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-white text-sm truncate">
              {userProfile.full_name || 'Admin'}
            </h4>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase mt-0.5">
              <UserCheck className="w-3 h-3" />
              {userProfile.role}
            </span>
          </div>
        </div>

        {/* Nav list */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                    : 'hover:bg-teal-900/40 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Exit Button */}
        <div className="p-4 border-t border-teal-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-slate-400 hover:text-rose-200 hover:bg-rose-950/20 transition-all cursor-pointer text-left"
          >
            <LogOut className="w-5 h-5 shrink-0 text-rose-400" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="p-4 md:p-8 flex-1">
          {children}
        </main>
      </div>

      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 md:hidden animate-in fade-in"
        />
      )}
    </div>
  )
}
