import { Link } from "wouter"
import { useListClaims } from "@workspace/api-client-react"
import { Plus, Search, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ClaimStatusBadge, RecommendationBadge } from "@/components/shared/StatusBadge"
import { format } from "date-fns"

export default function Dashboard() {
  const { data: claims, isLoading } = useListClaims()

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Claims Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage and analyze your active dispute cases.</p>
        </div>
        <Link href="/claims/new">
          <Button className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all rounded-full px-6">
            <Plus className="mr-2 h-4 w-4" />
            New Claim
          </Button>
        </Link>
      </div>

      <Card className="p-1 border-border/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search claims by ID or merchant..." className="pl-9 h-10 bg-background" />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading claims...</p>
          </div>
        ) : !claims || claims.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold font-display text-foreground">No claims found</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">You haven't created any claims yet. Start by creating a new claim to begin analysis.</p>
            <Link href="/claims/new">
              <Button className="mt-6 rounded-full">Create First Claim</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-4 rounded-tl-xl">Claim Details</th>
                  <th className="px-6 py-4">Merchant</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">AI Rec.</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right rounded-tr-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{claim.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">ID: {claim.id.slice(0, 8)}... | Order: {claim.orderId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {claim.merchantName.charAt(0)}
                        </div>
                        {claim.merchantName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ClaimStatusBadge status={claim.status} />
                    </td>
                    <td className="px-6 py-4">
                      {claim.recommendation ? <RecommendationBadge recommendation={claim.recommendation} /> : <span className="text-muted-foreground italic text-xs">Pending</span>}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(claim.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/claims/${claim.id}`}>
                        <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                          View Details
                        </Button>
                      </Link>
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
