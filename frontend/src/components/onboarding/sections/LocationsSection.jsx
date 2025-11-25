import React, { memo } from "react";
import { Plus, Trash2 } from "lucide-react";
import WeeklyHoursEditor from "../WeeklyHoursEditor";
import { IconButton, TextArea, TextInput, Toggle } from "../FormControls";

const LocationsSection = ({
  locations,
  onUpdateLocation,
  onRemoveLocation,
  onAddLocation,
  days,
}) => (
  <div className="space-y-6">
    {locations.map((location, index) => (
      <div
        key={location.id}
        className="space-y-5 rounded-2xl border border-background-hover bg-background-hover/80 p-5 shadow-inner"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary-dark">
              {location.label || `Location ${index + 1}`}
            </p>
            <p className="text-xs text-textcolor-secondary">
              Provide core contact and routing details.
            </p>
          </div>
          {locations.length > 1 ? (
            <IconButton
              label="Remove location"
              icon={Trash2}
              onClick={() => onRemoveLocation(location.id)}
              variant="ghost"
            />
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Location name"
            placeholder="Downtown Clinic"
            value={location.label}
            onChange={(event) =>
              onUpdateLocation(location.id, {
                ...location,
                label: event.target.value,
              })
            }
          />
          <TextInput
            label="Timezone"
            placeholder="America/Chicago"
            value={location.timezone}
            onChange={(event) =>
              onUpdateLocation(location.id, {
                ...location,
                timezone: event.target.value,
              })
            }
          />
          <TextInput
            label="Main phone"
            placeholder="(555) 123-4567"
            value={location.phone}
            onChange={(event) =>
              onUpdateLocation(location.id, {
                ...location,
                phone: event.target.value,
              })
            }
          />
          <TextInput
            label="Website URL"
            placeholder="https://example.com"
            value={location.website}
            onChange={(event) =>
              onUpdateLocation(location.id, {
                ...location,
                website: event.target.value,
              })
            }
          />
          <TextInput
            label="Directions URL"
            helper="Google Maps, Apple Maps, or custom directions link."
            placeholder="https://maps.google.com/..."
            value={location.directionsUrl}
            onChange={(event) =>
              onUpdateLocation(location.id, {
                ...location,
                directionsUrl: event.target.value,
              })
            }
          />
          <TextInput
            label="Default slot length (minutes)"
            type="number"
            min="5"
            value={location.defaultSlotLength}
            onChange={(event) =>
              onUpdateLocation(location.id, {
                ...location,
                defaultSlotLength: event.target.value,
              })
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextArea
            label="Bookable date window"
            helper="Example: Current date through 90 days out. Block past dates."
            rows={2}
            value={location.bookableWindow}
            onChange={(event) =>
              onUpdateLocation(location.id, {
                ...location,
                bookableWindow: event.target.value,
              })
            }
            placeholder="Earliest booking: today. Latest booking: 90 days out."
          />
          <TextArea
            label="Reschedule & cancellation policy"
            helper="Include grace periods, penalties, and communication preferences."
            rows={2}
            value={location.reschedulePolicy}
            onChange={(event) =>
              onUpdateLocation(location.id, {
                ...location,
                reschedulePolicy: event.target.value,
              })
            }
            placeholder="Notify us 24 hours in advance to avoid a $25 fee."
          />
        </div>

        <TextInput
          label="Late cancellation / no-show fee"
          placeholder="$25 after 24 hour window"
          value={location.lateFeePolicy}
          onChange={(event) =>
            onUpdateLocation(location.id, {
              ...location,
              lateFeePolicy: event.target.value,
            })
          }
        />

        <Toggle
          label="Allow same-day bookings"
          enabled={location.allowSameDay}
          onToggle={() =>
            onUpdateLocation(location.id, {
              ...location,
              allowSameDay: !location.allowSameDay,
            })
          }
        />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-primary-dark">
            Weekly business hours
          </h3>
          <WeeklyHoursEditor
            value={location.hours}
            onChange={(value) =>
              onUpdateLocation(location.id, {
                ...location,
                hours: value,
              })
            }
            days={days}
          />
        </div>

        <TextArea
          label="Holidays & planned closures"
          rows={3}
          placeholder="List recurring holidays, staff retreats, inventory days..."
          value={location.holidaysNotes}
          onChange={(event) =>
            onUpdateLocation(location.id, {
              ...location,
              holidaysNotes: event.target.value,
            })
          }
        />
      </div>
    ))}

    <IconButton label="Add another location" icon={Plus} onClick={onAddLocation} />
  </div>
);

export default memo(LocationsSection);
