import { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-lg border border-cyan-300/15 bg-[#071824]/80 text-card-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur-xl",
      className
    )}
    {...props}
  />
);
