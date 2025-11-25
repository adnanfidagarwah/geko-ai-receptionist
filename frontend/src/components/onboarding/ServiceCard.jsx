import React, { memo } from "react";
import { Trash2 } from "lucide-react";
import { IconButton, TextArea, TextInput, Toggle } from "./FormControls";

const ServiceCard = ({ service, onChange, onRemove, canRemove }) => (
  <div className="space-y-4 rounded-xl border border-background-hover bg-white px-5 py-4 shadow-sm">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-primary-dark">
        {service.name || "New Service"}
      </h3>
      {canRemove ? (
        <IconButton
          label="Remove"
          icon={Trash2}
          onClick={onRemove}
          variant="ghost"
        />
      ) : null}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <TextInput
        label="Service name"
        placeholder="Comprehensive Consult"
        value={service.name}
        onChange={(event) => onChange({ ...service, name: event.target.value })}
      />
      <TextInput
        label="Duration (minutes)"
        type="number"
        min="0"
        placeholder="45"
        value={service.duration}
        onChange={(event) =>
          onChange({ ...service, duration: event.target.value })
        }
      />
    </div>
    <TextArea
      label="Description"
      rows={3}
      placeholder="What happens during this service?"
      value={service.description}
      onChange={(event) =>
        onChange({ ...service, description: event.target.value })
      }
    />
    <TextInput
      label="Base price"
      type="number"
      min="0"
      placeholder="150"
      value={service.price}
      onChange={(event) =>
        onChange({ ...service, price: event.target.value })
      }
    />
    <div className="grid gap-3 md:grid-cols-3">
      <Toggle
        label="Requires evaluation first"
        enabled={service.requiresEvaluation}
        onToggle={() =>
          onChange({
            ...service,
            requiresEvaluation: !service.requiresEvaluation,
          })
        }
      />
      <Toggle
        label="Deposit required"
        enabled={service.requiresDeposit}
        onToggle={() =>
          onChange({
            ...service,
            requiresDeposit: !service.requiresDeposit,
          })
        }
      />
      <Toggle
        label="Maintenance (vs diagnostic)"
        enabled={service.isMaintenance}
        onToggle={() =>
          onChange({
            ...service,
            isMaintenance: !service.isMaintenance,
          })
        }
      />
    </div>
  </div>
);

export default memo(ServiceCard);
