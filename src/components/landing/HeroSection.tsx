import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoModal } from "@/components/ui/video-modal";
import { StatsCounter } from "@/components/ui/stats-counter";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/10 blur-3xl"
            style={{
              width: `${400 + i * 200}px`,
              height: `${400 + i * 200}px`,
              left: `${20 + i * 30}%`,
              top: `${10 + i * 20}%`,
            }}
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Trust Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <CheckCircle2 className="h-4 w-4" />
              Trusted by 10,000+ Nigerian Businesses
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary">
              Transform Your Tax Compliance Journey
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
              Eliminate 75% of tax filing complexity with AI-powered automation.
              Stay compliant with Nigeria's Tax Act 2025 while saving time and money.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="gap-2 text-lg"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Button>
              <VideoModal
                videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                title="Watch 2-Min Demo"
                triggerClassName="text-lg"
              />
            </div>

            {/* Trust Indicators */}
            <p className="text-sm text-muted-foreground">
              ✓ No credit card required • ✓ 14-day free trial • ✓ Cancel anytime
            </p>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border">
              <div>
                <div className="text-3xl font-bold text-primary">
                  <StatsCounter end={10000} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  <StatsCounter end={98} suffix="%" />
                </div>
                <div className="text-sm text-muted-foreground">On-Time Filing</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  <StatsCounter end={50000} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">Returns Filed</div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-card">
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg font-medium text-foreground">
                    Dashboard Preview Coming Soon
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <motion.div
              className="absolute -top-4 -right-4 p-4 rounded-lg bg-card border border-border shadow-lg"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="text-sm font-medium text-foreground">
                98% Filing Rate
              </div>
              <div className="text-xs text-muted-foreground">This month</div>
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -left-4 p-4 rounded-lg bg-card border border-border shadow-lg"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            >
              <div className="text-sm font-medium text-foreground">
                ₦2.5M Saved
              </div>
              <div className="text-xs text-muted-foreground">In penalties avoided</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
