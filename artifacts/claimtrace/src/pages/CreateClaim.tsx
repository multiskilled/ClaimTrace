import { useLocation } from "wouter"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useCreateClaim, CreateClaimInputClaimType } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Link } from "wouter"

const schema = z.object({
  title: z.string().min(3, "Title is required"),
  claimType: z.enum(["return", "warranty", "dispute", "damage", "other"]),
  merchantName: z.string().min(2, "Merchant name is required"),
  customerName: z.string().min(2, "Customer name is required"),
  orderId: z.string().min(1, "Order ID is required"),
  narrative: z.string().min(10, "Please provide a detailed narrative"),
  policyText: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function CreateClaim() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      claimType: "return"
    }
  })

  const { mutate: create, isPending } = useCreateClaim()

  const onSubmit = (data: FormData) => {
    create({ data }, {
      onSuccess: (res) => {
        toast({
          title: "Claim created successfully",
          description: "You can now upload evidence for analysis.",
        })
        setLocation(`/claims/${res.id}`)
      },
      onError: (err: Error) => {
        toast({
          title: "Failed to create claim",
          description: err.message || "An unexpected error occurred",
          variant: "destructive"
        })
      }
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="icon" className="rounded-xl h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Create New Claim</h1>
          <p className="text-muted-foreground mt-1 text-sm">Enter the core details to initialize a new dispute case.</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-md">
        <CardHeader className="bg-muted/20 border-b border-border/50 rounded-t-xl">
          <CardTitle>Case Information</CardTitle>
          <CardDescription>All fields except Policy Text are required.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Claim Title</Label>
                <Input placeholder="e.g. Broken screen on arrival" {...register("title")} />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Claim Type</Label>
                <select 
                  className="flex h-11 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                  {...register("claimType")}
                >
                  <option value="return">Return</option>
                  <option value="warranty">Warranty</option>
                  <option value="damage">Damage</option>
                  <option value="dispute">Dispute</option>
                  <option value="other">Other</option>
                </select>
                {errors.claimType && <p className="text-sm text-destructive">{errors.claimType.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Merchant Name</Label>
                <Input placeholder="e.g. TechGear Inc" {...register("merchantName")} />
                {errors.merchantName && <p className="text-sm text-destructive">{errors.merchantName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input placeholder="e.g. Jane Doe" {...register("customerName")} />
                {errors.customerName && <p className="text-sm text-destructive">{errors.customerName.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Order ID</Label>
                <Input placeholder="e.g. ORD-987654321" {...register("orderId")} />
                {errors.orderId && <p className="text-sm text-destructive">{errors.orderId.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Customer Narrative</Label>
              <Textarea 
                placeholder="Describe what the customer claims happened..." 
                className="min-h-[120px]"
                {...register("narrative")} 
              />
              {errors.narrative && <p className="text-sm text-destructive">{errors.narrative.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Relevant Policy Text (Optional)</Label>
              <Textarea 
                placeholder="Paste the relevant return/warranty policy here for AI context..." 
                className="min-h-[100px]"
                {...register("policyText")} 
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                type="submit" 
                size="lg" 
                disabled={isPending}
                className="w-full sm:w-auto rounded-full px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
              >
                {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isPending ? "Creating..." : "Create Claim & Continue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
