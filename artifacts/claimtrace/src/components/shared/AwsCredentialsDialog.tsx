import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Eye, EyeOff, HelpCircle, Trash2, CheckCircle2 } from "lucide-react"

export interface AwsCredentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
  s3BucketName: string
  sessionToken?: string
}

const STORAGE_KEY = "claimtrace_aws_creds"

export function loadSavedCredentials(): AwsCredentials | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AwsCredentials
  } catch {
    return null
  }
}

export function saveCredentials(creds: AwsCredentials) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds))
}

export function clearCredentials() {
  localStorage.removeItem(STORAGE_KEY)
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (creds: AwsCredentials) => void
  onClear?: () => void
  initialCreds?: AwsCredentials | null
}

export function AwsCredentialsDialog({ open, onOpenChange, onConfirm, onClear, initialCreds }: Props) {
  const [accessKeyId, setAccessKeyId] = useState("")
  const [secretAccessKey, setSecretAccessKey] = useState("")
  const [region, setRegion] = useState("us-east-1")
  const [s3BucketName, setS3BucketName] = useState("")
  const [sessionToken, setSessionToken] = useState("")
  const [showSecret, setShowSecret] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [saveForBrowser, setSaveForBrowser] = useState(true)

  useEffect(() => {
    if (open) {
      const creds = initialCreds ?? loadSavedCredentials()
      if (creds) {
        setAccessKeyId(creds.accessKeyId)
        setSecretAccessKey(creds.secretAccessKey)
        setRegion(creds.region || "us-east-1")
        setS3BucketName(creds.s3BucketName)
        setSessionToken(creds.sessionToken || "")
        setSaveForBrowser(true)
      }
    }
  }, [open, initialCreds])

  const isValid = accessKeyId.trim() && secretAccessKey.trim() && region.trim() && s3BucketName.trim()

  const handleConfirm = () => {
    const creds: AwsCredentials = {
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
      region: region.trim(),
      s3BucketName: s3BucketName.trim(),
      ...(sessionToken.trim() ? { sessionToken: sessionToken.trim() } : {}),
    }
    if (saveForBrowser) {
      saveCredentials(creds)
    } else {
      clearCredentials()
    }
    onConfirm(creds)
    onOpenChange(false)
  }

  const handleErase = () => {
    clearCredentials()
    setAccessKeyId("")
    setSecretAccessKey("")
    setRegion("us-east-1")
    setS3BucketName("")
    setSessionToken("")
    onClear?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">AWS Credentials</DialogTitle>
          <DialogDescription>
            Enter your AWS credentials to run AI analysis with Amazon Bedrock Nova Lite and store evidence in S3. Credentials are saved in your browser only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="accessKeyId">Access Key ID <span className="text-destructive">*</span></Label>
            <Input
              id="accessKeyId"
              value={accessKeyId}
              onChange={e => setAccessKeyId(e.target.value)}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              className="font-mono text-sm"
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="secretAccessKey">Secret Access Key <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                id="secretAccessKey"
                type={showSecret ? "text" : "password"}
                value={secretAccessKey}
                onChange={e => setSecretAccessKey(e.target.value)}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                className="font-mono text-sm pr-10"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowSecret(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="region">AWS Region <span className="text-destructive">*</span></Label>
              <Input
                id="region"
                value={region}
                onChange={e => setRegion(e.target.value)}
                placeholder="us-east-1"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s3BucketName">S3 Bucket Name <span className="text-destructive">*</span></Label>
              <Input
                id="s3BucketName"
                value={s3BucketName}
                onChange={e => setS3BucketName(e.target.value)}
                placeholder="my-claimtrace-bucket"
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="saveForBrowser"
              checked={saveForBrowser}
              onCheckedChange={(checked) => setSaveForBrowser(checked === true)}
            />
            <Label htmlFor="saveForBrowser" className="text-sm text-muted-foreground cursor-pointer">
              Save for this browser
            </Label>
          </div>

          <Accordion type="single" collapsible className="border rounded-xl px-1">
            <AccordionItem value="advanced" className="border-none">
              <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline py-3 px-3">
                Advanced: Session Token (optional)
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sessionToken" className="text-xs text-muted-foreground">Required only when using temporary credentials (AWS SSO, STS)</Label>
                  <div className="relative">
                    <Input
                      id="sessionToken"
                      type={showToken ? "text" : "password"}
                      value={sessionToken}
                      onChange={e => setSessionToken(e.target.value)}
                      placeholder="Session token (leave blank if using permanent IAM key)"
                      className="font-mono text-xs pr-10"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible className="border rounded-xl px-1">
            <AccordionItem value="guide" className="border-none">
              <AccordionTrigger className="text-sm hover:no-underline py-3 px-3 gap-2">
                <span className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                  How to get your AWS credentials
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4">
                <ol className="space-y-4 text-sm text-muted-foreground list-none">
                  <li className="flex gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-medium text-foreground mb-0.5">Create an IAM Access Key</p>
                      <p>Sign in to <strong>console.aws.amazon.com</strong> → IAM → Users → your user → <em>Security credentials</em> tab → <em>Create access key</em>. Choose "Application running outside AWS". Copy both keys — the secret is shown only once.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-medium text-foreground mb-0.5">Create an S3 Bucket</p>
                      <p>Go to <strong>S3 console</strong> → <em>Create bucket</em>. Choose a unique name in a US region (e.g. <code className="bg-muted px-1 rounded text-xs">us-east-1</code>). Leave other settings as default.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                    <div>
                      <p className="font-medium text-foreground mb-0.5">Attach IAM Permissions</p>
                      <p className="mb-2">Attach an inline policy to your IAM user. Amazon Nova Lite is now accessed via cross-region inference — no manual model access approval is needed.</p>
                      <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap">{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject","s3:GetObject"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}`}</pre>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                    <div>
                      <p className="font-medium text-foreground mb-0.5">Use a US region</p>
                      <p>Enter <code className="bg-muted px-1 rounded text-xs">us-east-1</code> or <code className="bg-muted px-1 rounded text-xs">us-west-2</code> as your region — Nova Lite cross-region inference is only available in US regions.</p>
                    </div>
                  </li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleErase}
            className="sm:mr-auto"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Erase Credentials
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Save & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
