import React, { memo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { IconButton, TextInput } from "./FormControls";

const CoverageMatrix = ({ plans, onPlanChange }) => {
  const updatePlan = (planId, nextPlan) => {
    onPlanChange(plans.map((plan) => (plan.id === planId ? nextPlan : plan)));
  };

  const addCoverage = (plan) => {
    const nextCoverage = {
      id: `${Date.now()}-${Math.random()}`,
      service: "",
      coverageDetail: "",
    };
    updatePlan(plan.id, {
      ...plan,
      coverages: [...plan.coverages, nextCoverage],
    });
  };

  const updateCoverage = (plan, coverageId, field, value) => {
    updatePlan(plan.id, {
      ...plan,
      coverages: plan.coverages.map((coverage) =>
        coverage.id === coverageId
          ? { ...coverage, [field]: value }
          : coverage,
      ),
    });
  };

  const removeCoverage = (plan, coverageId) => {
    updatePlan(plan.id, {
      ...plan,
      coverages: plan.coverages.filter(({ id }) => id !== coverageId),
    });
  };

  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="space-y-3 rounded-xl border border-background-hover bg-white px-5 py-4 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Plan name"
              placeholder="Acme Gold PPO"
              value={plan.name}
              onChange={(event) =>
                updatePlan(plan.id, { ...plan, name: event.target.value })
              }
            />
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-primary-dark">
              Coverage by service
            </h4>
            {plan.coverages.map((coverage) => (
              <div
                key={coverage.id}
                className="grid items-end gap-3 rounded-lg border border-background-hover bg-background-hover/80 px-4 py-3 md:grid-cols-[1fr,1fr,auto]"
              >
                <TextInput
                  label="Service"
                  placeholder="Annual exam"
                  value={coverage.service}
                  onChange={(event) =>
                    updateCoverage(
                      plan,
                      coverage.id,
                      "service",
                      event.target.value,
                    )
                  }
                />
                <TextInput
                  label="Coverage"
                  placeholder="80% covered"
                  value={coverage.coverageDetail}
                  onChange={(event) =>
                    updateCoverage(
                      plan,
                      coverage.id,
                      "coverageDetail",
                      event.target.value,
                    )
                  }
                />
                <IconButton
                  label="Remove"
                  icon={Trash2}
                  onClick={() => removeCoverage(plan, coverage.id)}
                  variant="ghost"
                />
              </div>
            ))}
            <IconButton
              label="Add coverage rule"
              icon={Plus}
              onClick={() => addCoverage(plan)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default memo(CoverageMatrix);
