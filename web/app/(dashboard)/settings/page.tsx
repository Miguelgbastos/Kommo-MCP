'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    apiBaseUrl: 'http://localhost:3001',
    apiToken: '',
    autoRefresh: true,
    logLevel: 'info',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSave = () => {
    console.log('Configurações salvas:', formData)
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-foreground mb-2">Configurações</h1>
      <p className="text-muted-foreground mb-8">Gerencie as configurações do dashboard</p>

      <div className="max-w-2xl">
        <div className="card space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Base URL da API
            </label>
            <input
              type="text"
              name="apiBaseUrl"
              value={formData.apiBaseUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              API Token
            </label>
            <input
              type="password"
              name="apiToken"
              value={formData.apiToken}
              onChange={handleChange}
              placeholder="Deixe em branco para usar .env"
              className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Nível de Log
            </label>
            <select
              name="logLevel"
              value={formData.logLevel}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="autoRefresh"
              checked={formData.autoRefresh}
              onChange={handleChange}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-foreground">
              Atualizar automaticamente
            </span>
          </label>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  )
}
