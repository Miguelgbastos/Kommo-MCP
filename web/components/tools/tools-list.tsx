'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const mockTools = [
  {
    name: 'list_leads',
    description: 'Retorna uma lista de leads do CRM',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Status do lead (new, in_progress, won, lost)' },
        limit: { type: 'number', description: 'Número máximo de resultados' },
      },
    },
  },
  {
    name: 'create_lead',
    description: 'Cria um novo lead no CRM',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome do lead' },
        email: { type: 'string', description: 'Email do lead' },
        phone: { type: 'string', description: 'Telefone do lead' },
      },
    },
  },
  {
    name: 'get_contacts',
    description: 'Retorna lista de contatos',
    inputSchema: {
      type: 'object',
      properties: {
        company_id: { type: 'string', description: 'ID da empresa' },
      },
    },
  },
]

export function ToolsList() {
  const [expandedTool, setExpandedTool] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-4">Tools Disponíveis</h2>
      {mockTools.map((tool) => (
        <div
          key={tool.name}
          className="card-sm cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() =>
            setExpandedTool(expandedTool === tool.name ? null : tool.name)
          }
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-foreground">{tool.name}</h3>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground transition-transform ${
                expandedTool === tool.name ? 'rotate-180' : ''
              }`}
            />
          </div>

          {expandedTool === tool.name && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                SCHEMA DE ENTRADA
              </p>
              <pre className="bg-slate-900/50 rounded p-3 text-xs text-foreground overflow-x-auto">
                {JSON.stringify(tool.inputSchema, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
