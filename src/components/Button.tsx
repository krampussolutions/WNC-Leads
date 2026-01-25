import { cn } from "@/lib/cn";

export function Button({
  children,
  className,
  variant = "primary",
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}) {
  const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-sky-600 text-white hover:bg-sky-500",
    secondary: "border border-slate-700 hover:bg-slate-900",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
    ghost: "hover:bg-slate-900",
  };
  return (
    <button type={type} disabled={disabled} className={cn(base, variants[variant], className)}>
      {children}
    </button>
  );
}
