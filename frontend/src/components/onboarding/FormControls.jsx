import React from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";

export const Field = ({ label, helper, children }) => (
  <label className="space-y-1.5">
    <span className="block text-sm font-medium text-textcolor">{label}</span>
    {children}
    {helper ? (
      <span className="block text-xs text-textcolor-muted">{helper}</span>
    ) : null}
  </label>
);

export const TextInput = ({ label, helper, className = "", ...props }) => (
  <Field label={label} helper={helper}>
    <input
      className={`w-full rounded-lg border border-background-hover bg-white px-3 py-2 text-sm text-textcolor shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${className}`}
      {...props}
    />
  </Field>
);

export const TextArea = ({
  label,
  helper,
  rows = 3,
  className = "",
  ...props
}) => (
  <Field label={label} helper={helper}>
    <textarea
      rows={rows}
      className={`w-full rounded-lg border border-background-hover bg-white px-3 py-2 text-sm text-textcolor shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${className}`}
      {...props}
    />
  </Field>
);

export const Toggle = ({ label, enabled, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="flex w-full items-center justify-between rounded-lg border border-background-hover bg-white px-4 py-2 text-left text-sm font-medium text-textcolor-secondary shadow-sm transition hover:border-accent/40 hover:shadow-md"
  >
    <span>{label}</span>
    {enabled ? (
      <ToggleRight className="h-5 w-5 text-accent-dark" />
    ) : (
      <ToggleLeft className="h-5 w-5 text-textcolor-muted" />
    )}
  </button>
);

export const IconButton = ({
  label,
  onClick,
  icon: Icon,
  variant = "ghost",
  disabled = false,
}) => {
  const base =
    "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition";
  const variantBase =
    variant === "ghost"
      ? "border-background-hover bg-white text-textcolor-secondary"
      : "border-transparent bg-primary text-white";
  const hoverStyles =
    variant === "ghost"
      ? "hover:border-accent/40 hover:text-primary"
      : "hover:bg-primary-dark";
  const disabledStyles = "cursor-not-allowed opacity-60";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variantBase} ${
        disabled ? disabledStyles : hoverStyles
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
};

