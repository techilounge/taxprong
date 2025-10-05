import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TaxProNGLogo } from "@/components/branding/TaxProNGLogo";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { ProblemSolutionSection } from "@/components/landing/ProblemSolutionSection";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { TestimonialCarousel } from "@/components/landing/TestimonialCarousel";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <TaxProNGLogo size="default" />
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth")}>Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Trust Bar */}
      <TrustBar />

      {/* Problem-Solution Section */}
      <ProblemSolutionSection />

      {/* Feature Showcase */}
      <FeatureShowcase />

      {/* Testimonials */}
      <TestimonialCarousel />

      {/* Comparison Section */}
      <ComparisonSection />

      {/* Pricing */}
      <PricingSection />

      {/* Security & Compliance */}
      <SecuritySection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA */}
      <CTASection />

      {/* Enhanced Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <TaxProNGLogo size="default" className="mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Nigeria's leading tax compliance platform, helping businesses stay compliant and save time.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Get tax tips monthly</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background"
                  />
                  <Button size="sm">Subscribe</Button>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Industries</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/knowledge" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Tax Guides</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
              <h3 className="font-semibold mb-4 mt-6">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} TaxProNG. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
