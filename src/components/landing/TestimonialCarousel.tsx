import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Star, Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Adebayo Johnson",
    title: "CEO",
    company: "TechStart Nigeria",
    quote: "TaxProNG reduced our tax preparation time from 2 weeks to just 3 days. The AI advisor feature alone is worth its weight in gold.",
    rating: 5,
    initials: "AJ",
  },
  {
    name: "Chioma Okafor",
    title: "Tax Consultant",
    company: "Okafor & Associates",
    quote: "Managing 15 clients was a nightmare before TaxProNG. Now I can handle 30+ clients with ease. The automation features are incredible.",
    rating: 5,
    initials: "CO",
  },
  {
    name: "Ibrahim Yusuf",
    title: "Finance Director",
    company: "Northern Foods Ltd",
    quote: "We've saved over ₦5M in potential penalties by never missing a filing deadline. The compliance calendar is a game-changer.",
    rating: 5,
    initials: "IY",
  },
  {
    name: "Ngozi Eze",
    title: "Small Business Owner",
    company: "Eze Fashion House",
    quote: "As a non-accountant, tax season used to terrify me. TaxProNG makes it simple and stress-free. I can't imagine going back to the old way.",
    rating: 5,
    initials: "NE",
  },
  {
    name: "Oluwaseun Adeyemi",
    title: "CFO",
    company: "Lagos Trading Co",
    quote: "The industry-specific calculators for our oil & gas operations have been spot-on. Accuracy and compliance are now guaranteed.",
    rating: 5,
    initials: "OA",
  },
  {
    name: "Fatima Mohammed",
    title: "Accountant",
    company: "KanoTech Solutions",
    quote: "The document generation feature saves me 10+ hours every month. Everything is pre-filled and formatted correctly. Brilliant!",
    rating: 5,
    initials: "FM",
  },
];

export const TestimonialCarousel = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section ref={ref} className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">
            Loved by Businesses Across Nigeria
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied users who've transformed their tax compliance
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/2">
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <Quote className="h-8 w-8 text-primary mb-4" />
                      
                      {/* Rating */}
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>

                      {/* Quote */}
                      <p className="text-foreground mb-6 italic">
                        "{testimonial.quote}"
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {testimonial.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-foreground">
                            {testimonial.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {testimonial.title}, {testimonial.company}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </motion.div>

        {/* Review Aggregators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <span className="text-lg font-semibold">4.9/5</span>
            <span>from 500+ reviews</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
