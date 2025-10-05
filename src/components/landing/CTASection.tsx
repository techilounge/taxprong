import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Users, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCounter } from "@/components/ui/stats-counter";

export const CTASection = () => {
  const navigate = useNavigate();
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section ref={ref} className="py-20 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-secondary" />
      
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10 blur-3xl"
            style={{
              width: `${300 + i * 150}px`,
              height: `${300 + i * 150}px`,
              left: `${10 + i * 35}%`,
              top: `${20 + i * 15}%`,
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, 20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Main CTA Content */}
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Ready to Transform Your Tax Compliance?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join 10,000+ Nigerian businesses already saving time and money with TaxProNG
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/auth")}
              className="gap-2 text-lg shadow-xl hover:shadow-2xl"
            >
              Start Your Free Trial
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.location.href = "mailto:sales@taxpro.ng"}
              className="gap-2 text-lg bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Schedule a Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/90 text-sm mb-12">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* Social Proof Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                <StatsCounter end={10000} suffix="+" className="text-white" />
              </div>
              <div className="text-white/80">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                <StatsCounter end={98} suffix="%" className="text-white" />
              </div>
              <div className="text-white/80">On-Time Filing Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                <StatsCounter end={2.5} suffix="M" decimals={1} prefix="₦" className="text-white" />
              </div>
              <div className="text-white/80">Penalties Avoided</div>
            </div>
          </motion.div>

          {/* Recent Signup Notification */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm"
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>125 businesses signed up this week</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
