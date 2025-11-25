import React, { memo } from "react";
import { Plus, Trash2 } from "lucide-react";
import CoverageMatrix from "../CoverageMatrix";
import { IconButton, TextArea, Toggle } from "../FormControls";

const InsuranceSection = ({
  plans,
  onPlanChange,
  onAddPlan,
  onRemovePlan,
  paymentOptions,
  selectedPaymentMethods,
  onTogglePaymentMethod,
  financingDetails,
  onFinancingDetailsChange,
}) => (
  <div className="space-y-6">
    <div className="space-y-4 rounded-2xl border border-background-hover bg-background-hover/80 p-5 shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-primary-dark">
            Supported insurance plans
          </h3>
          <p className="text-xs text-textcolor-secondary">
            Reference exact plan names so verification is ultra-clear.
          </p>
        </div>
        <IconButton label="Add plan" icon={Plus} onClick={onAddPlan} />
      </div>

      <CoverageMatrix plans={plans} onPlanChange={onPlanChange} />

      {plans.length > 1 ? (
        <div className="flex flex-wrap gap-3">
          {plans.map((plan) => (
            <IconButton
              key={plan.id}
              label={`Remove ${plan.name || "plan"}`}
              icon={Trash2}
              onClick={() => onRemovePlan(plan.id)}
              variant="ghost"
            />
          ))}
        </div>
      ) : null}
    </div>

    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-primary-dark">
        Payment methods
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {paymentOptions.map((option) => (
          <Toggle
            key={option}
            label={option}
            enabled={selectedPaymentMethods.has(option)}
            onToggle={() => onTogglePaymentMethod(option)}
          />
        ))}
      </div>
    </div>

    <TextArea
      label="Financing options"
      placeholder="Describe financing partners, terms, minimums..."
      rows={3}
      value={financingDetails}
      onChange={(event) => onFinancingDetailsChange(event.target.value)}
    />
  </div>
);

export default memo(InsuranceSection);
