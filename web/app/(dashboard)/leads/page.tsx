import { LeadsTable } from '@/components/leads/leads-table'
import { LeadsHeader } from '@/components/leads/leads-header'

export default function LeadsPage() {
  return (
    <div className="p-8">
      <LeadsHeader />
      <LeadsTable />
    </div>
  )
}
