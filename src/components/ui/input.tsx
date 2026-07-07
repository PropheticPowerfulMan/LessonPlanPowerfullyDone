import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      "h-10 w-full rounded-md border border-cyan-300/20 bg-[#030d14]/80 px-3 text-sm text-foreground outline-none backdrop-blur-md transition placeholder:text-muted-foreground focus:border-cyan-200 focus:ring-2 focus:ring-cyan-400/20",
      className
    )}
    {...props}
  />
);

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={cn(
      "min-h-24 w-full resize-y rounded-md border border-cyan-300/20 bg-[#030d14]/80 px-3 py-2 text-sm text-foreground outline-none backdrop-blur-md transition placeholder:text-muted-foreground focus:border-cyan-200 focus:ring-2 focus:ring-cyan-400/20",
      className
    )}
    {...props}
  />
);

export const Select = ({ className, ...props }: InputHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={cn(
      "h-10 w-full rounded-md border border-cyan-300/20 bg-[#030d14]/80 px-3 text-sm text-foreground outline-none backdrop-blur-md transition focus:border-cyan-200 focus:ring-2 focus:ring-cyan-400/20",
      className
    )}
    {...props}
  />
);
