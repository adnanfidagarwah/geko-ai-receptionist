import clsx from "clsx";

export function Badge({ children, variant = "default", className = "" }) {
  const baseClasses =
    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border";

  const variants = {
    default: "bg-background-hover text-textcolor border-muted",
    success: "bg-success/20 text-success-dark border-success/20",
    error: "bg-error/20 text-error-dark border-error/20",
    warning: "bg-warning/20 text-warning-dark border-warning/20",
    info: "bg-accent/20 text-accent-dark border-accent/20",
    outline: "bg-transparent text-textcolor border-muted",
  };

  return (
    <span className={clsx(baseClasses, variants[variant], className)}>
      {children}
    </span>
  );
}
