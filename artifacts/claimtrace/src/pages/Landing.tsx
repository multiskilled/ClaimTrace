import { Link } from "wouter"
import { motion } from "framer-motion"
import { ArrowRight, ShieldCheck, Zap, Scale, FileSearch } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="absolute inset-x-0 top-0 z-50 h-24 flex items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">ClaimTrace</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button className="rounded-full px-6 font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 relative">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
              alt="Hero background" 
              className="w-full h-full object-cover opacity-80 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-8">
                <Zap className="h-4 w-4" />
                <span>Powered by Amazon Bedrock Nova Lite</span>
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-8 leading-[1.1]">
                Evidence Intelligence for <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  Modern Dispute Resolution
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                Upload receipts, photos, and narratives. ClaimTrace instantly reconstructs timelines, identifies contradictions, and recommends decisions using advanced multimodal AI.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto rounded-full px-8 h-14 text-base font-semibold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1">
                    Start Resolving Claims
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-24 bg-background relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">How ClaimTrace Works</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">From messy evidence to clear decisions in seconds, without leaving your workspace.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "1. Upload Evidence",
                  desc: "Drag and drop receipts, chat logs, photos, and policies. We handle all file types directly to secure S3 storage.",
                  icon: FileSearch
                },
                {
                  title: "2. AI Analysis",
                  desc: "Amazon Nova Lite extracts facts, maps out a chronological timeline, and flags contradictions in the story.",
                  icon: Zap
                },
                {
                  title: "3. Make a Decision",
                  desc: "Review the generated confidence score and AI recommendation, then sync the final verdict back to your portal.",
                  icon: Scale
                }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-card border border-border/50 rounded-3xl p-8 hover-lift"
                >
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
