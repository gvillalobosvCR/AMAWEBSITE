import { createClient } from '@/lib/supabase/server'
import { FileText, Users, Baby, CalendarClock, ChevronRight, User } from 'lucide-react'
import Link from 'next/link'
import { formatDateTimeUTC } from '@/lib/date-utils'

export const revalidate = 0
export const dynamic = 'force-dynamic'

function getCRTimeBounds(daysOffset = 0) {
  const d = new Date()
  // Adjust for Costa Rica timezone offset (UTC-6)
  d.setHours(d.getHours() - 6)
  if (daysOffset !== 0) {
    d.setDate(d.getDate() + daysOffset)
  }
  d.setHours(0, 0, 0, 0)
  // Re-adjust back to UTC before querying Supabase
  d.setHours(d.getHours() + 6)
  return d.toISOString()
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const todayStr = getCRTimeBounds(0)
  const weekStr = getCRTimeBounds(-7)
  const monthStr = getCRTimeBounds(-30)

  // Fetch metrics in parallel
  const [
    { count: todayCount },
    { count: weekCount },
    { count: monthCount },
    { count: minorCount },
    { data: recentWaivers },
  ] = await Promise.all([
    supabase.from('waivers').select('*', { count: 'exact', head: true }).gte('created_at', todayStr),
    supabase.from('waivers').select('*', { count: 'exact', head: true }).gte('created_at', weekStr),
    supabase.from('waivers').select('*', { count: 'exact', head: true }).gte('created_at', monthStr),
    supabase.from('waivers').select('*', { count: 'exact', head: true }).eq('is_minor', true),
    supabase
      .from('waivers')
      .select('id, waiver_number, full_name, id_passport, age, created_at, language')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    {
      name: 'Waivers Hoy / Today',
      value: todayCount || 0,
      icon: CalendarClock,
      color: 'bg-emerald-500 text-white',
      desc: 'Completados el día de hoy',
    },
    {
      name: 'Esta Semana / Week',
      value: weekCount || 0,
      icon: FileText,
      color: 'bg-teal-600 text-white',
      desc: 'Últimos 7 días de registro',
    },
    {
      name: 'Este Mes / Month',
      value: monthCount || 0,
      icon: Users,
      color: 'bg-teal-800 text-white',
      desc: 'Últimos 30 días de registro',
    },
    {
      name: 'Menores / Minors',
      value: minorCount || 0,
      icon: Baby,
      color: 'bg-amber-500 text-white',
      desc: 'Menores de edad registrados',
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard</h2>
        <p className="text-slate-500 text-sm md:text-base mt-1">
          Estadísticas y resumen de actividad de descargos de responsabilidad.
        </p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 transition-all duration-200 hover:shadow-md"
            >
              <div className={`p-4 rounded-xl shrink-0 ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <span className="text-xs md:text-sm font-semibold text-slate-400 block truncate">
                  {stat.name}
                </span>
                <span className="text-3xl font-black text-slate-800 block mt-1">
                  {stat.value}
                </span>
                <span className="text-slate-400 text-xxs md:text-xs block mt-1 truncate">
                  {stat.desc}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent submissions table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800">
            Descargos Recientes / Recent Waivers
          </h3>
          <Link
            href="/admin/waivers"
            className="text-sm font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle px-6">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-4">Código / Code</th>
                  <th className="pb-4">Nombre / Name</th>
                  <th className="pb-4">ID / Passport</th>
                  <th className="pb-4">Edad / Age</th>
                  <th className="pb-4">Idioma / Lang</th>
                  <th className="pb-4">Fecha y Hora / Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 text-sm">
                {recentWaivers && recentWaivers.length > 0 ? (
                  recentWaivers.map((w) => {
                    const date = new Date(w.created_at)
                    return (
                      <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 font-mono font-bold text-teal-800">
                          {w.waiver_number}
                        </td>
                        <td className="py-4 font-semibold text-slate-800">{w.full_name}</td>
                        <td className="py-4 font-mono">{w.id_passport}</td>
                        <td className="py-4">{w.age}</td>
                        <td className="py-4 uppercase">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xxs font-bold ${
                              w.language === 'es'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-teal-50 text-teal-700 border border-teal-100'
                            }`}
                          >
                            {w.language}
                          </span>
                        </td>
                         <td className="py-4">
                           {formatDateTimeUTC(w.created_at)}
                         </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      No hay waivers registrados el día de hoy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
