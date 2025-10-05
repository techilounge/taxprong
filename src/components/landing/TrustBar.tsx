import { motion } from "framer-motion";

const clients = [
  "FirstBank",
  "Dangote Group",
  "MTN Nigeria",
  "Access Bank",
  "Flour Mills",
  "Nestle Nigeria",
  "Nigerian Breweries",
  "Guaranty Trust Bank",
];

export const TrustBar = () => {
  return (
    <section className="py-12 border-y border-border bg-muted/30">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Trusted by leading Nigerian businesses
        </p>
        
        <div className="relative overflow-hidden">
          <motion.div
            className="flex gap-12 items-center"
            animate={{
              x: [0, -1000],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 20,
                ease: "linear",
              },
            }}
          >
            {/* Duplicate the array to create seamless loop */}
            {[...clients, ...clients].map((client, index) => (
              <div
                key={index}
                className="flex-shrink-0 text-2xl font-bold text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                {client}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
