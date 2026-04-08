'use client'

import Link from 'next/link'
import { Activity, LogOut, Settings } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="border-b border-border bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
      <div className="px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Kommo MCP</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/settings" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </Link>
          <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
            <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>
    </nav>
  )
}
