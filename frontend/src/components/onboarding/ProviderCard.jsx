import React, { memo } from "react";
import { Trash2 } from "lucide-react";
import { IconButton, TextArea, TextInput } from "./FormControls";

const ProviderCard = ({ provider, onChange, onRemove, canRemove }) => (
  <div className="space-y-4 rounded-xl border border-background-hover bg-white px-5 py-4 shadow-sm">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-primary-dark">
        {provider.name || "New Provider"}
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
        label="Provider name"
        placeholder="Dr. Jane Smith"
        value={provider.name}
        onChange={(event) => onChange({ ...provider, name: event.target.value })}
      />
      <TextInput
        label="Title"
        placeholder="Lead Physician, MD"
        value={provider.title}
        onChange={(event) => onChange({ ...provider, title: event.target.value })}
      />
    </div>
    <TextArea
      label="Specialties"
      rows={2}
      placeholder="e.g., General practice, Pediatrics"
      value={provider.specialties}
      onChange={(event) =>
        onChange({ ...provider, specialties: event.target.value })
      }
    />
    <TextArea
      label="Services performed"
      rows={2}
      helper="Reference services defined in the catalog."
      placeholder="Annual wellness visits, telehealth visits, lab follow-ups..."
      value={provider.services}
      onChange={(event) =>
        onChange({ ...provider, services: event.target.value })
      }
    />
    <TextArea
      label="Schedule notes (optional)"
      rows={2}
      placeholder="Preferred working days, telehealth availability, blackout dates..."
      value={provider.scheduleNotes}
      onChange={(event) =>
        onChange({ ...provider, scheduleNotes: event.target.value })
      }
    />
  </div>
);

export default memo(ProviderCard);
