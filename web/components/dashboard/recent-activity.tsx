'use client'

const activities = [
  { id: 1, action: 'API Call', time: '5m atrás', status: 'success' },
  { id: 2, action: 'Lead Created', time: '12m atrás', status: 'success' },
  { id: 3, action: 'Error Handled', time: '1h atrás', status: 'error' },
  { id: 4, action: 'Tool Executed', time: '2h atrás', status: 'success' },
]

export function RecentActivity() {
  return (
    <div className="card">
      <h3 className="text-lg font-bold text-foreground mb-4">Atividade Recente</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/20"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{activity.action}</p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
            <div
              className={`w-2 h-2 rounded-full ${
                activity.status === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
