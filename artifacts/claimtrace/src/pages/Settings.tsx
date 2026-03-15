import { useGetSettingsStatus, useSeedDemoData } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, XCircle, Database, Cloud, BrainCircuit, Loader2 } from "lucide-react"

export default function Settings() {
  const { data: status, isLoading, refetch } = useGetSettingsStatus()
  const { mutate: seed, isPending: isSeeding } = useSeedDemoData()
  const { toast } = useToast()

  const handleSeed = () => {
    seed(undefined, {
      onSuccess: () => {
        toast({ title: "Demo data seeded", description: "3 sample claims have been generated." })
      },
      onError: (err: any) => {
        toast({ title: "Seeding failed", description: err.message, variant: "destructive" })
      }
    })
  }

  const ServiceCard = ({ name, icon: Icon, info }: { name: string, icon: any, info?: any }) => (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-base">{name}</CardTitle>
        </div>
        {info?.connected ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <XCircle className="h-5 w-5 text-destructive" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          {info?.connected ? (
            <span className="text-success font-medium">Connected & Operational</span>
          ) : (
            <span className="text-destructive font-medium">{info?.error || "Not configured"}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage AWS integrations and application state.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          Refresh Status
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : status ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ServiceCard name="Amazon S3" icon={Cloud} info={status.s3} />
            <ServiceCard name="PostgreSQL" icon={Database} info={status.database} />
            <ServiceCard name="Amazon Bedrock" icon={BrainCircuit} info={status.bedrock} />
          </div>

          <Card className="border-border/50 shadow-sm mt-8">
            <CardHeader className="bg-muted/20 border-b border-border/50 rounded-t-xl">
              <CardTitle>Configuration Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 text-sm">
                <div>
                  <dt className="text-muted-foreground mb-1">AWS Region</dt>
                  <dd className="font-mono font-medium text-foreground bg-muted inline-block px-2 py-1 rounded">{status.region}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">Active Bedrock Model</dt>
                  <dd className="font-mono font-medium text-foreground bg-muted inline-block px-2 py-1 rounded">{status.modelId}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card className="border-primary/20 bg-primary/5 shadow-md mt-8">
        <CardHeader>
          <CardTitle>Demo & Development</CardTitle>
          <CardDescription>Generate realistic demo data for testing the application flows.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSeed} disabled={isSeeding} className="shadow-md">
            {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Seed 3 Demo Claims
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
