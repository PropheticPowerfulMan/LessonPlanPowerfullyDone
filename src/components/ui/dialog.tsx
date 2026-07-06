import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./button";

export const Dialog = ({
  open,
  title,
  children,
  onClose
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) => (
  <AnimatePresence>
    {open && (
      <motion.div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-xl border bg-card p-5 shadow-fluent"
          initial={{ y: 20, scale: 0.98 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 20, scale: 0.98 }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{title}</h2>
            <Button variant="ghost" onClick={onClose} aria-label="Close">
              <X size={18} />
            </Button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
