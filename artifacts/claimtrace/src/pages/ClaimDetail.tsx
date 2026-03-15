import { useState } from "react"
import { useRoute } from "wouter"
import { 
  useGetClaimById, 
  useListEvidence, 
  useGetAnalysis, 
  useGetAuditTrail,
  useAnalyzeClaim,
  useSyncToPortal,
  useGetUploadUrl,
  useConfirmUpload,
  ConfirmUploadInputFileType
} from "@workspace/api-client-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClaimStatusBadge, RecommendationBadge } from "@/components/shared/StatusBadge"
import { format } from "date-fns"
import { Loader2, BrainCircuit, UploadCloud, AlertTriangle, FileCheck2, ArrowRightLeft, Clock, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useDropzone } from "react-dropzone"
import { cn } from "@/lib/utils"

export default function ClaimDetail() {
  const [, params] = useRoute("/claims/:id")
  const claimId = params?.id || ""
  const { toast } = useToast()
  
  const { data: claim, isLoading: loadingClaim, refetch: refetchClaim } = useGetClaimById(claimId)
  const { data: evidence, isLoading: loadingEvidence, refetch: refetchEvidence } = useListEvidence(claimId)
  const { data: analysis, isLoading: loadingAnalysis, refetch: refetchAnalysis } = useGetAnalysis(claimId)
  const { data: audit, isLoading: loadingAudit } = useGetAuditTrail(claimId)

  const { mutate: triggerAnalyze, isPending: isAnalyzing } = useAnalyzeClaim()
  const { mutate: syncPortal, isPending: isSyncing } = useSyncToPortal()
  const { mutateAsync: getUrl } = useGetUploadUrl()
  const { mutateAsync: confirmUpload } = useConfirmUpload()

  const [uploading, setUploading] = useState(false)

  const onDrop = async (acceptedFiles: File[]) => {
    setUploading(true)
    try {
      for (const file of acceptedFiles) {
        // 1. Get presigned URL
        const fileTypeMap: Record<string, ConfirmUploadInputFileType> = {
          "image/jpeg": "photo",
          "image/png": "photo",
          "application/pdf": "document",
        }
        const mappedType = fileTypeMap[file.type] || "document"
        
        const { uploadUrl, s3Key } = await getUrl({ 
          claimId, 
          data: { fileName: file.name, fileType: mappedType, mimeType: file.type } 
        })
        
        // 2. Mock PUT to S3 (in a real app this uses the presigned URL directly)
        // await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
        await new Promise(r => setTimeout(r, 800)) // simulate upload delay

        // 3. Confirm metadata
        await confirmUpload({ 
          claimId, 
          data: { s3Key, fileName: file.name, fileType: mappedType, mimeType: file.type } 
        })
      }
      toast({ title: "Evidence uploaded successfully" })
      refetchEvidence()
      refetchClaim()
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const handleAnalyze = () => {
    triggerAnalyze({ claimId }, {
      onSuccess: () => {
        toast({ title: "Analysis complete", description: "Nova Lite generated new insights." })
        refetchAnalysis()
        refetchClaim()
      },
      onError: (err: any) => toast({ title: "Analysis failed", description: err.message, variant: "destructive" })
    })
  }

  const handleSync = () => {
    if (!analysis) return
    syncPortal({ claimId, data: { decision: analysis.recommendation, notes: analysis.summary } }, {
      onSuccess: () => {
        toast({ title: "Synced to Portal", description: "Decision successfully pushed to internal portal." })
        refetchClaim()
      },
      onError: (err: any) => toast({ title: "Sync failed", description: err.message, variant: "destructive" })
    })
  }

  if (loadingClaim) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (!claim) {
    return <div className="p-8 text-center text-muted-foreground">Claim not found.</div>
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Panel */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ClaimStatusBadge status={claim.status} />
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">ID: {claim.id}</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">{claim.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Merchant: {claim.merchantName}</span>
            <span>•</span>
            <span>Customer: {claim.customerName}</span>
            <span>•</span>
            <span>Order: {claim.orderId}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Button 
            variant="outline" 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || (evidence?.length === 0)}
            className="rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary"
          >
            {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4 text-primary" />}
            Run AI Analysis
          </Button>
          <Button 
            onClick={handleSync} 
            disabled={isSyncing || claim.status !== "analyzed"}
            className="rounded-xl shadow-lg shadow-primary/20"
          >
            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
            Send to Portal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="xl:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full bg-card border border-border/50 p-1 rounded-xl h-14 justify-start overflow-x-auto gap-2">
              <TabsTrigger value="overview" className="rounded-lg h-10 px-6 data-[state=active]:shadow-sm">Overview</TabsTrigger>
              <TabsTrigger value="evidence" className="rounded-lg h-10 px-6 data-[state=active]:shadow-sm">Evidence ({evidence?.length || 0})</TabsTrigger>
              <TabsTrigger value="analysis" className="rounded-lg h-10 px-6 data-[state=active]:shadow-sm" disabled={!analysis}>AI Analysis</TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-lg h-10 px-6 data-[state=active]:shadow-sm" disabled={!analysis?.timeline}>Timeline</TabsTrigger>
              <TabsTrigger value="audit" className="rounded-lg h-10 px-6 data-[state=active]:shadow-sm">Audit Trail</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6 space-y-6 outline-none">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="bg-muted/20 border-b border-border/50 rounded-t-xl">
                  <CardTitle>Customer Narrative</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{claim.narrative}</p>
                </CardContent>
              </Card>

              {claim.policyText && (
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="bg-muted/20 border-b border-border/50 rounded-t-xl">
                    <CardTitle>Applicable Policy</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground text-sm italic leading-relaxed">{claim.policyText}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="evidence" className="mt-6 outline-none">
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer bg-card mb-6",
                  isDragActive ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <UploadCloud className="h-8 w-8 text-primary" />}
                </div>
                <h3 className="text-lg font-bold font-display mb-2">
                  {isDragActive ? "Drop files here" : "Upload new evidence"}
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Drag and drop receipts, chat logs, or damage photos. Amazon Nova will analyze them automatically.
                </p>
                <Button variant="outline" className="mt-6 rounded-full" disabled={uploading}>
                  Browse Files
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {loadingEvidence ? (
                  <div className="col-span-full py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
                ) : evidence?.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-muted-foreground">No evidence uploaded yet.</div>
                ) : (
                  evidence?.map((item) => (
                    <div key={item.id} className="bg-card border border-border/50 rounded-xl p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
                      <div className="bg-muted p-3 rounded-lg shrink-0">
                        {item.fileType === "photo" ? <Search className="h-6 w-6 text-indigo-500" /> : <FileCheck2 className="h-6 w-6 text-teal-500" />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-sm truncate">{item.fileName}</p>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{item.fileType}</p>
                        <p className="text-xs text-muted-foreground mt-1">{format(new Date(item.uploadedAt), "MMM d, h:mm a")}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="mt-6 space-y-6 outline-none">
              {analysis ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-destructive/20 bg-destructive/5">
                      <CardHeader>
                        <CardTitle className="flex items-center text-destructive">
                          <AlertTriangle className="mr-2 h-5 w-5" /> Contradictions Found
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {analysis.contradictions?.length ? (
                          <ul className="list-disc pl-5 space-y-2 text-sm text-foreground">
                            {analysis.contradictions.map((c, i) => <li key={i}>{c}</li>)}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">None identified by Nova.</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-warning/20 bg-warning/5">
                      <CardHeader>
                        <CardTitle className="flex items-center text-warning-foreground">
                          <Search className="mr-2 h-5 w-5" /> Missing Evidence
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {analysis.missingEvidence?.length ? (
                          <ul className="list-disc pl-5 space-y-2 text-sm text-foreground">
                            {analysis.missingEvidence.map((c, i) => <li key={i}>{c}</li>)}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">Evidence looks complete.</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-border/50">
                    <CardHeader className="bg-muted/20 border-b border-border/50">
                      <CardTitle>Extracted Facts</CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted/10 text-muted-foreground text-xs uppercase font-semibold">
                          <tr>
                            <th className="px-6 py-3">Fact Label</th>
                            <th className="px-6 py-3">Value</th>
                            <th className="px-6 py-3">Confidence</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {analysis.extractedFacts?.map((fact, i) => (
                            <tr key={i}>
                              <td className="px-6 py-3 font-medium">{fact.label}</td>
                              <td className="px-6 py-3">{fact.value}</td>
                              <td className="px-6 py-3">
                                <span className={cn(
                                  "px-2 py-1 rounded-md text-xs font-semibold uppercase",
                                  fact.confidence === "high" ? "bg-success/15 text-success" : 
                                  fact.confidence === "medium" ? "bg-warning/15 text-warning-foreground" : 
                                  "bg-destructive/15 text-destructive"
                                )}>
                                  {fact.confidence}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              ) : (
                <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/50">
                  Run AI analysis to see insights.
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="mt-6 outline-none">
               <Card className="border-border/50 p-6">
                 <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {analysis?.timeline?.map((event, i) => (
                      <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border/50 bg-card shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-foreground">{event.date}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">{event.event}</div>
                          <div className="mt-3 text-xs font-mono text-primary/70 bg-primary/5 inline-block px-2 py-1 rounded">Src: {event.source}</div>
                        </div>
                      </div>
                    ))}
                 </div>
               </Card>
            </TabsContent>

            <TabsContent value="audit" className="mt-6 outline-none">
              <Card className="border-border/50">
                <div className="divide-y divide-border/50">
                  {audit?.map((log) => (
                    <div key={log.id} className="p-4 flex gap-4">
                      <div className="text-xs text-muted-foreground whitespace-nowrap pt-1 w-32 font-mono">
                        {format(new Date(log.timestamp), "MMM d, HH:mm")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{log.eventType.replace(/_/g, ' ').toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{log.message}</p>
                        <p className="text-xs text-muted-foreground mt-1 opacity-60">Actor: {log.actor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-md bg-gradient-to-br from-card to-muted/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">AI Recommendation</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis ? (
                <div className="space-y-6">
                  <div className="flex justify-center py-4">
                    <RecommendationBadge recommendation={analysis.recommendation} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2 font-medium">
                      <span>Confidence Score</span>
                      <span className="text-primary">{Math.round(analysis.confidenceScore * 100)}%</span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          analysis.confidenceScore > 0.8 ? "bg-success" : analysis.confidenceScore > 0.5 ? "bg-warning" : "bg-destructive"
                        )}
                        style={{ width: `${analysis.confidenceScore * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground leading-relaxed bg-background p-4 rounded-xl border border-border/50">
                    "{analysis.summary}"
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-6">
                  Analysis not yet run.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
