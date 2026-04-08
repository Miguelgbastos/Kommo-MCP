import { ToolsList } from '@/components/tools/tools-list'
import { ToolsTester } from '@/components/tools/tools-tester'

export default function ToolsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Tools Explorer</h1>
        <p className="text-muted-foreground">Explore e teste todas as tools disponíveis do MCP</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ToolsList />
        </div>
        <div>
          <ToolsTester />
        </div>
      </div>
    </div>
  )
}
