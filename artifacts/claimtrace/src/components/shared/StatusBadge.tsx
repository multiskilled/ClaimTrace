import { Badge } from "@/components/ui/badge"
import { ClaimStatus, ClaimRecommendation, PortalRecordDecision, PortalRecordPortalStatus } from "@workspace/api-client-react"

export function ClaimStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: any }> = {
    [ClaimStatus.draft]: { label: "Draft", variant: "secondary" },
    [ClaimStatus.evidence_uploaded]: { label: "Evidence Ready", variant: "info" },
    [ClaimStatus.analyzing]: { label: "Analyzing...", variant: "warning" },
    [ClaimStatus.analyzed]: { label: "Analyzed", variant: "success" },
    [ClaimStatus.synced]: { label: "Synced", variant: "outline" },
  }
  
  const mapped = map[status] || { label: status, variant: "outline" }
  
  return <Badge variant={mapped.variant}>{mapped.label}</Badge>
}

export function RecommendationBadge({ recommendation }: { recommendation: string }) {
  const map: Record<string, { label: string; variant: any }> = {
    [ClaimRecommendation.approve]: { label: "Approve", variant: "success" },
    [ClaimRecommendation.reject]: { label: "Reject", variant: "destructive" },
    [ClaimRecommendation.human_review]: { label: "Human Review", variant: "warning" },
  }
  
  const mapped = map[recommendation] || { label: recommendation, variant: "outline" }
  
  return <Badge variant={mapped.variant}>{mapped.label}</Badge>
}

export function PortalStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: any }> = {
    [PortalRecordPortalStatus.pending]: { label: "Pending", variant: "warning" },
    [PortalRecordPortalStatus.synced]: { label: "Synced", variant: "success" },
    [PortalRecordPortalStatus.rejected]: { label: "Rejected", variant: "destructive" },
    [PortalRecordPortalStatus.approved]: { label: "Approved", variant: "success" },
  }
  
  const mapped = map[status] || { label: status, variant: "outline" }
  
  return <Badge variant={mapped.variant}>{mapped.label}</Badge>
}
