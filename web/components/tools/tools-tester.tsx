'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'

export function ToolsTester() {
  const [selectedTool, setSelectedTool] = useState('list_leads')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    try {
      // Simulado
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setResult({
        success: true,
        data: [
          { id: 1, name: 'João Silva', status: 'new' },
          { id: 2, name: 'Maria Santos', status: 'in_progress' },
        ],
      })
    } catch (error) {
      setResult({ success: false, error: 'Erro ao executar tool' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-foreground mb-4">Testador de Tools</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Selecionar Tool
          </label>
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="list_leads">list_leads</option>
            <option value="create_lead">create_lead</option>
            <option value="get_contacts">get_contacts</option>
          </select>
        </div>

        <button
          onClick={handleTest}
          disabled={loading}
          className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          {loading ? 'Executando...' : 'Executar'}
        </button>

        {result && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              RESULTADO
            </p>
            <pre className="bg-slate-900/50 rounded p-3 text-xs text-foreground overflow-x-auto max-h-64">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
