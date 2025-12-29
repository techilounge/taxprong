import { useState } from "react";
import { MessageCircleQuestion, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaxQAPanel } from "./TaxQAPanel";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingTaxQAProps {
  orgId: string;
  returnId?: string;
  returnType?: "cit" | "pit" | "vat";
  onInsertNote?: (answer: string, citations?: any[]) => void | Promise<void>;
}

export function FloatingTaxQA({ orgId, returnId, returnType, onInsertNote }: FloatingTaxQAProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Icon Button */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 ring-2 ring-amber-400"
        >
          <MessageCircleQuestion className="h-5 w-5" />
        </Button>
      </motion.div>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Slide-out Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full lg:w-[400px] z-50 bg-background border-l shadow-2xl overflow-hidden"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Ask a Tax Question</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto">
                <TaxQAPanel
                  orgId={orgId}
                  returnId={returnId}
                  returnType={returnType}
                  onInsertNote={onInsertNote}
                  className="border-0 shadow-none h-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
