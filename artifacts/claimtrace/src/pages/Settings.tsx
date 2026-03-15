import { useState, useEffect } from "react"
import { useGetSettingsStatus, useSeedDemoData } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, XCircle, Database, Loader2, KeyRound, Trash2, Pencil } from "lucide-react"
import { AwsCredentialsDialog, loadSavedCredentials, clearCredentials, type AwsCredentials } from "@/components/shared/AwsCredentialsDialog"

export default function Settings() {
  const { data: status, isLoading } = useGetSettingsStatus()
  const { mutate: seed, isPending: isSeeding } = useSeedDemoData()
  const { toast } = useToast()

  const [credDialogOpen, setCredDialogOpen] = useState(false)
  const [savedCreds, setSavedCreds] = useState<AwsCredentials | null>(null)

  useEffect(() => {
    setSavedCreds(loadSavedCredentials())
  }, [])

  const handleSeed = () => {
    seed(undefined, {
      onSuccess: () => {
        toast({ title: "Demo data seeded", description: "3 sample claims have been generated." })
      },
      onError: (err: Error) => {
        toast({ title: "Seeding failed", description: err.message, variant: "destructive" })
      }
    })
  }

  const handleCredConfirm = (creds: AwsCredentials) => {
    setSavedCreds(creds)
    toast({ title: "Credentials saved", description: "Your AWS credentials are stored in this browser." })
  }

  const handleEraseCreds = () => {
    clearCredentials()
    setSavedCreds(null)
    toast({ title: "Credentials erased", description: "AWS credentials have been removed from this browser." })
  }

  const maskKey = (key: string) => `${key.slice(0, 4)}••••••••${key.slice(-4)}`

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your AWS credentials and application state.</p>
      </div>

      {/* AWS Credentials Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/20 border-b border-border/50 rounded-t-xl flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">AWS Credentials</CardTitle>
              <CardDescription className="text-xs mt-0.5">Used for Bedrock AI analysis and S3 evidence storage</CardDescription>
            </div>
          </div>
          {savedCreds ? (
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
        </CardHeader>
        <CardContent className="p-6">
          {savedCreds ? (
            <div className="space-y-4">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="text-muted-foreground mb-1">Access Key ID</dt>
                  <dd className="font-mono font-medium bg-muted inline-block px-2 py-1 rounded text-xs">{maskKey(savedCreds.accessKeyId)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">Region</dt>
                  <dd className="font-mono font-medium bg-muted inline-block px-2 py-1 rounded text-xs">{savedCreds.region}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">S3 Bucket</dt>
                  <dd className="font-mono font-medium bg-muted inline-block px-2 py-1 rounded text-xs">{savedCreds.s3BucketName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">Secret Key</dt>
                  <dd className="font-mono font-medium bg-muted inline-block px-2 py-1 rounded text-xs">••••••••••••••••</dd>
                </div>
              </dl>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => setCredDialogOpen(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit Credentials
                </Button>
                <Button variant="destructive" size="sm" onClick={handleEraseCreds}>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Erase Credentials
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">No credentials saved. Add your AWS credentials to enable AI analysis and evidence uploads.</p>
              <Button onClick={() => setCredDialogOpen(true)}>
                <KeyRound className="mr-2 h-4 w-4" />
                Configure AWS Credentials
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Status Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">PostgreSQL Database</CardTitle>
          </div>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : status?.database?.connected ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            {isLoading ? (
              <span className="text-muted-foreground">Checking…</span>
            ) : status?.database?.connected ? (
              <span className="text-success font-medium">Connected & Operational</span>
            ) : (
              <span className="text-destructive font-medium">{status?.database?.error || "Not configured"}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AWS Setup Guide */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/20 border-b border-border/50 rounded-t-xl">
          <CardTitle>Getting Started with AWS</CardTitle>
          <CardDescription>Follow these steps to set up Amazon Bedrock Nova Lite and S3 for ClaimTrace.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ol className="space-y-6">
            <li className="flex gap-4">
              <span className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</span>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Create an IAM Access Key</p>
                <p className="text-sm text-muted-foreground">
                  Sign in to <strong>console.aws.amazon.com</strong> → IAM → Users → your user → <em>Security credentials</em> tab → <em>Create access key</em>. Choose "Application running outside AWS". Save both the Access Key ID and Secret Access Key — the secret is shown only once.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</span>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Create an S3 Bucket</p>
                <p className="text-sm text-muted-foreground">
                  Go to <strong>S3 console</strong> → <em>Create bucket</em>. Pick a unique name, select a region where Bedrock Nova Lite is available (e.g. <code className="bg-muted px-1 rounded text-xs">us-east-1</code>), and keep default settings. Note the bucket name — you'll enter it in the credentials dialog.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</span>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Enable Amazon Bedrock Nova Lite</p>
                <p className="text-sm text-muted-foreground">
                  Go to <strong>Amazon Bedrock console</strong> → <em>Model access</em> (left sidebar) → click <em>Manage model access</em> → find <strong>Amazon Nova Lite</strong> → check the box and click <em>Save changes</em>. Access is typically granted within a few minutes.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">4</span>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Attach IAM Permissions</p>
                <p className="text-sm text-muted-foreground">
                  In IAM → your user → <em>Add permissions</em> → <em>Create inline policy</em> → JSON editor. Paste this policy (replace <code className="bg-muted px-1 rounded text-xs">YOUR-BUCKET-NAME</code>):
                </p>
                <pre className="bg-muted rounded-xl p-4 text-xs overflow-x-auto whitespace-pre">{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}`}</pre>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Demo Data */}
      <Card className="border-primary/20 bg-primary/5 shadow-md">
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

      <AwsCredentialsDialog
        open={credDialogOpen}
        onOpenChange={setCredDialogOpen}
        onConfirm={handleCredConfirm}
        initialCreds={savedCreds}
      />
    </div>
  )
}
