import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "primary", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
      variant === "primary" && "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-105",
      variant === "secondary" && "bg-secondary text-secondary-foreground hover:brightness-105",
      variant === "ghost" && "hover:bg-muted",
      variant === "outline" && "border bg-card hover:bg-muted",
      variant === "danger" && "bg-destructive text-destructive-foreground hover:brightness-105",
      className
    )}
    {...props}
  />
));

Button.displayName = "Button";
