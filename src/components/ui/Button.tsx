import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "success" | "danger" | "ghost";
type Size = "md" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-white active:bg-primary-strong",
  secondary: "bg-white text-primary border border-primary active:bg-primary-soft",
  // reserved for the final action of the flow (sending the inventory)
  success: "bg-success text-white active:bg-success-strong",
  danger: "bg-white text-danger border border-danger active:bg-danger-soft",
  ghost: "text-primary active:bg-primary-soft",
};

// md is at least 48px tall: the app is used one-handed in stores
const SIZES: Record<Size, string> = {
  md: "min-h-12 px-4 text-base",
  sm: "min-h-10 px-2 text-sm",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

export function buttonClasses({ variant = "primary", size = "md", fullWidth = false }: Omit<ButtonProps, "children">) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors",
    "disabled:opacity-40 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? "w-full" : "",
  ].join(" ");
}

export default function Button({ variant, size, fullWidth, className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={`${buttonClasses({ variant, size, fullWidth })} ${className}`} {...props} />;
}
