import React from "react";
import clsx from "clsx";

export default function StatCard({
  title,
  subtitle,
  value,
  icon: Icon,
  footer,
  variant = "default",
  progress,
  tone = "solid", // "solid" | "flat"
  accentColor,
}) {
  const isFlat = tone === "flat";
  const variants = {
    default: "bg-background-card text-textcolor",
    primary: "bg-primary text-white",
    success: "bg-success text-white",
    error: "bg-error text-white",
    warning: "bg-warning text-white",
  };

  const iconStyle =
    isFlat && accentColor
      ? { color: accentColor, backgroundColor: `${accentColor}1a` } // 10% alpha
      : undefined;

  return (
    <div
      className={clsx(
        "rounded-xl p-6 flex flex-col gap-3 transition",
        isFlat
          ? "bg-white border border-background-hover shadow-sm hover:shadow-md text-textcolor"
          : clsx("shadow-md hover:shadow-lg", variants[variant]),
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <div
              className={clsx(
                "h-10 w-10 rounded-lg flex items-center justify-center",
                isFlat ? "bg-success/10 text-success" : "bg-white/20",
              )}
              style={iconStyle}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium">{title}</h3>
            {subtitle && <p className="text-xs opacity-80">{subtitle}</p>}
          </div>
        </div>
      </div>

      <div className={clsx("text-2xl font-bold", isFlat ? "text-textcolor" : "text-inherit")}>{value}</div>

      {/* Progress (optional) */}
      {progress !== undefined && (
        <div
          className={clsx(
            "w-full h-2 rounded-full overflow-hidden",
            isFlat ? "bg-background-hover" : "bg-white/20",
          )}
        >
          <div
            className={clsx("h-full transition-all", isFlat ? "bg-success/50" : "bg-white/60")}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {footer && (
        <div className={clsx("text-sm mt-auto opacity-80", isFlat ? "text-textcolor-secondary" : "text-inherit")}>
          {footer}
        </div>
      )}
    </div>
  );
}
