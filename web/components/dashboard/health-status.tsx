'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'

interface ServerStatus {
  status: 'online' | 'offline' | 'loading'
  uptime: number
  version: string
  toolsCount: number
}

export function HealthStatus() {
  const [status, setStatus] = useState<ServerStatus>({
    status: 'loading',
    uptime: 0,
    version: '2.1',
    toolsCount: 0,
  })

  useEffect(() => {
    // Simulado - conectar com API real
    const timer = setTimeout(() => {
      setStatus({
        status: 'online',
        uptime: Math.floor(Math.random() * 86400),
        version: '2.1',
        toolsCount: 12,
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const isOnline = status.status === 'online'
  const icon = status.status === 'loading' ? Loader : isOnline ? CheckCircle : AlertCircle

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Status do Servidor</h2>
          <p className="text-muted-foreground text-sm">Informações de saúde do MCP</p>
        </div>
        <div className={`flex items-center gap-2 ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
          {icon === Loader ? (
            <Loader className="w-6 h-6 animate-spin" />
          ) : icon === CheckCircle ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <AlertCircle className="w-6 h-6" />
          )}
          <span className="font-semibold">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/30 rounded-lg p-4 border border-border">
          <p className="text-muted-foreground text-xs mb-2">Versão MCP</p>
          <p className="text-2xl font-bold text-foreground">{status.version}</p>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-4 border border-border">
          <p className="text-muted-foreground text-xs mb-2">Uptime</p>
          <p className="text-2xl font-bold text-foreground">{Math.floor(status.uptime / 3600)}h</p>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-4 border border-border">
          <p className="text-muted-foreground text-xs mb-2">Tools Disponíveis</p>
          <p className="text-2xl font-bold text-foreground">{status.toolsCount}</p>
        </div>
      </div>
    </div>
  )
}
