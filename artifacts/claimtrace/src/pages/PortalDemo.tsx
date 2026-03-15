import { useListPortalRecords } from "@workspace/api-client-react"
import { Card } from "@/components/ui/card"
import { PortalStatusBadge, RecommendationBadge } from "@/components/shared/StatusBadge"
import { format } from "date-fns"
import { Database, Loader2 } from "lucide-react"

export default function PortalDemo() {
  const { data: records, isLoading } = useListPortalRecords()

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Internal Portal Sync</h1>
        <p className="text-muted-foreground mt-1 text-sm">Simulated back-office view of records synced from ClaimTrace.</p>
      </div>

      <Card className="border-border/50 shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : !records || records.length === 0 ? (
          <div className="p-16 text-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-xl">No records synced</h3>
            <p className="text-muted-foreground mt-2">Process a claim and click "Send to Portal" to see it here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-4">Claim ID</th>
                  <th className="px-6 py-4">Decision</th>
                  <th className="px-6 py-4">Sync Status</th>
                  <th className="px-6 py-4">Notes Snapshot</th>
                  <th className="px-6 py-4 text-right">Synced At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold">{record.claimId}</td>
                    <td className="px-6 py-4">
                      <RecommendationBadge recommendation={record.decision} />
                    </td>
                    <td className="px-6 py-4">
                      <PortalStatusBadge status={record.portalStatus} />
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-muted-foreground" title={record.portalNotes}>
                      {record.portalNotes || "—"}
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {format(new Date(record.syncedAt), "MMM d, HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
