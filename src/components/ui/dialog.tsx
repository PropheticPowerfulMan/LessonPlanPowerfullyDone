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
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          className="glass flex h-[96vh] w-[96vw] flex-col overflow-hidden rounded-lg border-cyan-300/20 p-4"
          initial={{ y: 18, scale: 0.98 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 18, scale: 0.98 }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-white">{title}</h2>
            <Button variant="ghost" onClick={onClose} aria-label="Close">
              <X size={18} />
            </Button>
          </div>
          <div className="flex-1 overflow-auto">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
