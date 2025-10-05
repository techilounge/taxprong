import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TaxProNGLogo } from "@/components/branding/TaxProNGLogo";
import { useNavigate } from "react-router-dom";
import { 
  Calculator, 
  FileText, 
  Shield, 
  Brain, 
  Clock, 
  Users,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Smartphone
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "AI Tax Advisor",
      description: "Get instant answers to your tax questions with our AI-powered advisor trained on Nigeria Tax Act 2025"
    },
    {
      icon: Calculator,
      title: "Smart Calculators",
      description: "Accurate calculations for VAT, PIT, CIT, CGT, Stamp Duty, and industry-specific tax computations"
    },
    {
      icon: Shield,
      title: "Compliance Tracking",
      description: "Never miss a deadline with automated compliance monitoring and risk assessment"
    },
    {
      icon: FileText,
      title: "Document Generation",
      description: "Generate tax returns, invoices, and compliance documents with ease"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Track your tax obligations with real-time dashboards and predictive insights"
    },
    {
      icon: Smartphone,
      title: "Mobile Access",
      description: "Manage your taxes on-the-go with our native mobile apps for iOS and Android"
    }
  ];

  const benefits = [
    "Multi-tenant platform for individuals and tax professionals",
    "Real-time compliance health score",
    "Automated expense tracking and categorization",
    "Client portal for tax consultants",
    "E-invoicing ready for 2026 mandate",
    "Secure cloud backup and data export"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="bg-gradient-primary text-white">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <TaxProNGLogo size="default" className="text-white [&_span]:text-white [&_div]:bg-white/20 [&_div]:text-white" />
          <div className="flex gap-4">
            <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button className="bg-white text-primary hover:bg-white/90" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Professional Tax Management<br />for Nigeria
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Simplify compliance, maximize accuracy, and stay ahead with Nigeria's most advanced tax platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90" onClick={() => navigate('/auth')}>
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Watch Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Stay Compliant</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for Nigerian businesses and tax professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:shadow-brand transition-shadow">
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Why Choose TaxProNG?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Designed specifically for the Nigerian tax landscape with the Nigeria Tax Act 2025 fully integrated
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-lg">{benefit}</p>
                  </div>
                ))}
              </div>
              <Button size="lg" className="mt-8" onClick={() => navigate('/auth')}>
                Get Started Today
              </Button>
            </div>

            <div className="relative">
              <Card className="shadow-brand">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-2xl">10,000+</h3>
                        <p className="text-muted-foreground">Active Users</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-accent/10">
                        <Clock className="h-8 w-8 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-2xl">95%</h3>
                        <p className="text-muted-foreground">On-Time Filing Rate</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-info/10">
                        <FileText className="h-8 w-8 text-info" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-2xl">50,000+</h3>
                        <p className="text-muted-foreground">Tax Returns Filed</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Tax Management?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of Nigerian businesses and tax professionals using TaxProNG
          </p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90" onClick={() => navigate('/auth')}>
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-secondary text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <span className="text-2xl font-bold">TaxPro<span className="text-primary">NG</span></span>
              </div>
              <p className="text-white/70">
                Professional tax management platform for Nigeria
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-white/70">
                <li><a href="/auth" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="/auth" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/auth" className="hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-white/70">
                <li><a href="/knowledge" className="hover:text-white transition-colors">Knowledge Base</a></li>
                <li><a href="/auth" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="/auth" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-white/70">
                <li><a href="/auth" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/auth" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/auth" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/70">
            <p>&copy; 2025 TaxProNG. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
