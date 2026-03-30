import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.12)] hover:brightness-110 active:brightness-95 active:shadow-none",
  outline:
    "border border-border bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-muted hover:border-border active:bg-accent",
  ghost:
    "text-foreground hover:bg-muted active:bg-accent",
  danger:
    "bg-error text-error-foreground shadow-[0_1px_2px_rgba(0,0,0,0.1)] hover:brightness-110 active:brightness-95",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-sm gap-2.5 rounded-xl",
};

const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className = "", variant = "primary", size = "md", ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
});

Button.displayName = "Button";
export { Button };
