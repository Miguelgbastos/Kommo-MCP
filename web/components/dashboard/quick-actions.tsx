'use client'

import Link from 'next/link'
import { Plus, Users, FileText } from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      icon: Plus,
      label: 'Novo Lead',
      href: '/leads/new',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Users,
      label: 'Contatos',
      href: '/contacts',
      color: 'bg-accent/10 text-accent',
    },
    {
      icon: FileText,
      label: 'Relatórios',
      href: '/reports',
      color: 'bg-green-500/10 text-green-500',
    },
  ]

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-foreground mb-4">Ações Rápidas</h3>
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-primary/50 transition-colors ${action.color}`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{action.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
