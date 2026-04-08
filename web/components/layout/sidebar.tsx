'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, LayoutDashboard, Wrench, Users, FileText, Cog } from 'lucide-react'

const navigation = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tools', label: 'Tools Explorer', icon: Wrench },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/resources', label: 'Recursos', icon: FileText },
  { href: '/settings', label: 'Configurações', icon: Cog },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-border bg-slate-900/50 backdrop-blur-md hidden md:flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="font-semibold text-foreground">Menu</h2>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Versão MCP</p>
          <p>2.1</p>
        </div>
      </div>
    </aside>
  )
}
