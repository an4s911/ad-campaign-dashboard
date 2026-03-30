import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className = "", variant = "primary", ...props }, ref) => {
  const variantClassName =
    variant === "outline"
      ? "border border-border bg-background text-foreground hover:bg-muted hover:opacity-100"
      : "bg-primary text-primary-foreground hover:opacity-90";

  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${variantClassName} ${className}`}
      {...props}
    />
  );
});

Button.displayName = "Button";
export { Button };
