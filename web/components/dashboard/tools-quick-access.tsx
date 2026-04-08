'use client'

import Link from 'next/link'
import { Wrench, ArrowRight } from 'lucide-react'

const tools = [
  { name: 'list_leads', description: 'Listar todos os leads' },
  { name: 'create_lead', description: 'Criar novo lead' },
  { name: 'get_contacts', description: 'Obter contatos' },
]

export function ToolsQuickAccess() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary" />
            Tools Disponíveis
          </h2>
        </div>
        <Link
          href="/tools"
          className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1 transition-colors"
        >
          Ver todos <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="bg-slate-800/30 rounded-lg p-4 border border-border hover:border-primary/50 transition-colors cursor-pointer group"
          >
            <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              {tool.name}
            </h3>
            <p className="text-sm text-muted-foreground">{tool.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
