import { InputHTMLAttributes, forwardRef } from "react";

const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`flex h-10 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent disabled:pointer-events-none disabled:opacity-40 ${className}`}
      {...props}
    />
  );
});

Input.displayName = "Input";
export { Input };
