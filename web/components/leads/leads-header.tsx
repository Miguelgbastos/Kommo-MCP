'use client'

import Link from 'next/link'
import { Plus, Search } from 'lucide-react'

export function LeadsHeader() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Leads</h1>
        <p className="text-muted-foreground">Gerencie todos os leads do seu CRM</p>
      </div>
      <Link
        href="/leads/new"
        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Novo Lead
      </Link>
    </div>
  )
}
