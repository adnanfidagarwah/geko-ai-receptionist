import clsx from "clsx";
import { Brain, Zap, CheckCircle } from "lucide-react";
import { Badge } from "../ui/Badge";

export default function Hero({
  icon = Brain,
  title,
  subtitle,
  badges = [],
  stats = [],
  variant = "gradient", // "gradient" | "minimal"
}) {
  const Icon = icon;
  const isMinimal = variant === "minimal";

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-3xl p-6 md:p-8",
        isMinimal
          ? "bg-white border border-background-hover text-textcolor-default shadow-sm"
          : "bg-gradient-to-br from-primary-dark via-primary to-accent text-white",
      )}
    >
      {!isMinimal && <div className="absolute inset-0 opacity-10"></div>}

      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div
              className={clsx(
                "h-12 w-12 md:h-16 md:w-16 rounded-3xl flex items-center justify-center",
                isMinimal ? "bg-success/10 text-success" : "bg-white/10 backdrop-blur-sm",
              )}
            >
              <Icon className="h-6 w-6 md:h-8 md:w-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
              <p
                className={clsx(
                  "text-sm md:text-base",
                  isMinimal ? "text-textcolor-secondary" : "text-white/80",
                )}
              >
                {subtitle}
              </p>
            </div>
          </div>
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, idx) => (
                <Badge key={idx} className={badge.className}>
                  {badge.icon && <badge.icon className="h-3 w-3 mr-1" />}
                  {badge.text}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={clsx(
                "rounded-xl p-4",
                isMinimal ? "bg-background-hover" : "bg-white/10 backdrop-blur-sm",
              )}
            >
              <div
                className={clsx(
                  "text-xs md:text-sm",
                  isMinimal ? "text-textcolor-secondary" : "text-white/80",
                )}
              >
                {stat.label}
              </div>
              <div className={clsx("text-xl md:text-2xl font-bold", isMinimal ? "text-textcolor-default" : "text-white")}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

  );
}
