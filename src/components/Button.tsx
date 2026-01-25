import * as React from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({
  className = "",
  variant = "primary",
  type,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition " +
    "disabled:opacity-50 disabled:pointer-events-none";

  const styles: Record<Variant, string> = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-500",
    secondary: "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700",
    danger: "bg-red-600 text-white hover:bg-red-500",
    ghost: "bg-transparent text-white hover:bg-slate-900 border border-slate-800",
  };

  return (
    <button
      type={type ?? "button"}   // prevents accidental form submits
      className={`${base} ${styles[variant]} ${className}`}
      {...props}               // this includes onClick, disabled, etc.
    />
  );
}
