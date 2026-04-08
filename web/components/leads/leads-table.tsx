'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

const mockLeads = [
  { id: 1, name: 'João Silva', email: 'joao@example.com', status: 'new', value: 'R$ 5.000' },
  { id: 2, name: 'Maria Santos', email: 'maria@example.com', status: 'in_progress', value: 'R$ 8.000' },
  { id: 3, name: 'Pedro Costa', email: 'pedro@example.com', status: 'won', value: 'R$ 12.000' },
]

export function LeadsTable() {
  const [searchTerm, setSearchTerm] = useState('')

  const statusColor = {
    new: 'bg-blue-500/10 text-blue-500',
    in_progress: 'bg-yellow-500/10 text-yellow-500',
    won: 'bg-green-500/10 text-green-500',
    lost: 'bg-red-500/10 text-red-500',
  }

  return (
    <div className="card">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Valor</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {mockLeads.map((lead) => (
              <tr key={lead.id} className="border-b border-border hover:bg-slate-800/20">
                <td className="px-4 py-3 text-foreground">{lead.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{lead.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColor[lead.status as keyof typeof statusColor]
                    }`}
                  >
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground">{lead.value}</td>
                <td className="px-4 py-3">
                  <button className="text-primary hover:text-primary/80 text-xs font-medium">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
