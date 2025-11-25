import React, { forwardRef, memo } from "react";
import {
  CheckCircle2,
  CircleDashed,
  ChevronDown,
} from "lucide-react";
import { IconButton } from "./FormControls";

const SectionCardBase = forwardRef(
  (
    {
      icon: Icon,
      title,
      subtitle,
      status,
      children,
      isOpen,
      onToggle,
      stepNumber,
      totalSteps,
      onMarkComplete,
      completionHint,
    },
    ref,
  ) => {
    const statusConfig = {
      complete: {
        label: "Completed",
        icon: <CheckCircle2 className="h-4 w-4 text-success-dark" />,
        badge: "border-success/40 bg-success/10 text-success-dark",
        card: "border-success/30 shadow-md shadow-success/20",
        accent: "from-success/40 to-success/10",
        iconBg: "bg-success/10 text-success-dark",
      },
      active: {
        label: "In progress",
        icon: <CircleDashed className="h-4 w-4 text-accent-dark" />,
        badge: "border-accent/40 bg-accent/10 text-accent-dark",
        card: "border-accent/40 shadow-xl shadow-accent/20",
        accent: "from-accent/40 to-primary/20",
        iconBg: "bg-accent/10 text-accent-dark",
      },
      upcoming: {
        label: "Pending",
        icon: <CircleDashed className="h-4 w-4 text-textcolor-muted" />,
        badge: "border-background-hover bg-white text-textcolor-secondary",
        card: "border-background-hover shadow-sm",
        accent: null,
        iconBg: "bg-background-hover text-textcolor-muted",
      },
    };

    const current = statusConfig[status] ?? statusConfig.upcoming;

    return (
      <section
        ref={ref}
        className={`relative overflow-hidden rounded-2xl border bg-white transition-all duration-500 ${current.card}`}
      >
        {current.accent ? (
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${current.accent}`}
          />
        ) : null}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="flex w-full items-start gap-4 border-b border-background-hover px-6 py-5 text-left transition-colors duration-300 hover:bg-background-hover/80"
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${current.iconBg}`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              {typeof stepNumber === "number" && typeof totalSteps === "number" ? (
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-textcolor-muted">
                  Step {stepNumber} of {totalSteps}
                </span>
              ) : null}
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${current.badge}`}
              >
                {current.icon}
                {current.label}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-textcolor">{title}</h2>
            {subtitle ? (
              <p className="text-sm text-textcolor-secondary">{subtitle}</p>
            ) : null}
          </div>
          <span
            className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-background-hover bg-white text-textcolor-muted transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <ChevronDown className="h-4 w-4" />
          </span>
        </button>
        {isOpen ? (
          <div className="px-6 pb-6 pt-5">
            {children}
            {onMarkComplete ? (
              <div className="mt-8 flex flex-col gap-4 border-t border-background-hover pt-5 sm:flex-row sm:items-center sm:justify-between">
                {completionHint ? (
                  <p className="text-xs text-textcolor-secondary">{completionHint}</p>
                ) : (
                  <span className="text-xs text-textcolor-muted">
                    Mark complete once this section looks good.
                  </span>
                )}
                <IconButton
                  label={status === "complete" ? "Marked complete" : "Mark section complete"}
                  icon={CheckCircle2}
                  onClick={onMarkComplete}
                  variant={status === "complete" ? "ghost" : "solid"}
                  disabled={status === "complete"}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    );
  },
);

SectionCardBase.displayName = "SectionCard";

const SectionCard = memo(SectionCardBase);

export default SectionCard;
