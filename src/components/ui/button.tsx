import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ type = "button", className, variant = "primary", ...props }, ref) => (
  <button
    type={type}
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
      variant === "primary" && "border border-white/30 bg-[linear-gradient(135deg,#f8fbff,#7de8ff_32%,#14b8de_70%,#0786ad)] text-[#031018] shadow-[0_14px_32px_rgba(20,184,222,0.28)] hover:brightness-110",
      variant === "secondary" && "border border-emerald-300/25 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25",
      variant === "ghost" && "text-muted-foreground hover:bg-white/10 hover:text-white",
      variant === "outline" && "border border-cyan-300/25 bg-white/[0.06] text-foreground shadow-sm backdrop-blur-md hover:border-cyan-200/45 hover:bg-cyan-500/15",
      variant === "danger" && "border border-red-300/30 bg-red-500/20 text-red-100 hover:bg-red-500/30",
      className
    )}
    {...props}
  />
));

Button.displayName = "Button";
