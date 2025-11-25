import React, { memo } from "react";
import { Plus, Trash2 } from "lucide-react";
import ServiceCard from "../ServiceCard";
import { IconButton, TextArea, TextInput } from "../FormControls";

const ServicesSection = ({
  services,
  onUpdateService,
  onRemoveService,
  onAddService,
  unsupportedServices,
  onUnsupportedServicesChange,
  addOns,
  onAddAddOn,
  onUpdateAddOn,
  onRemoveAddOn,
}) => (
  <div className="space-y-6">
    {services.map((service) => (
      <ServiceCard
        key={service.id}
        service={service}
        onChange={(nextService) => onUpdateService(service.id, nextService)}
        onRemove={() => onRemoveService(service.id)}
        canRemove={services.length > 1}
      />
    ))}

    <IconButton label="Add service" icon={Plus} onClick={onAddService} />

    <div className="rounded-2xl border border-background-hover bg-background-hover/80 p-5 shadow-inner">
      <h3 className="text-sm font-semibold text-primary-dark">
        Unsupported or unavailable services
      </h3>
      <p className="mt-1 text-xs text-textcolor-secondary">
        Help the AI decline requests that fall outside your scope.
      </p>
      <TextArea
        rows={3}
        placeholder="We do not offer: walk-in lab work, emergency care, weekend call coverage..."
        value={unsupportedServices}
        onChange={(event) => onUnsupportedServicesChange(event.target.value)}
        className="mt-3"
      />
    </div>

    <div className="space-y-4 rounded-2xl border border-background-hover bg-background-hover/80 p-5 shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-primary-dark">
            Add-ons & bundles (optional)
          </h3>
          <p className="text-xs text-textcolor-secondary">
            Upsell or package services to simplify recommendations.
          </p>
        </div>
        <IconButton label="Add add-on" icon={Plus} onClick={onAddAddOn} />
      </div>
      {addOns.length === 0 ? (
        <p className="text-sm text-textcolor-secondary">
          No add-ons configured yet.
        </p>
      ) : (
        <div className="space-y-4">
          {addOns.map((addOn) => (
            <div
              key={addOn.id}
              className="grid gap-4 rounded-xl border border-background-hover bg-white px-4 py-4 md:grid-cols-3"
            >
              <TextInput
                label="Name"
                placeholder="VIP Follow-up Package"
                value={addOn.name}
                onChange={(event) =>
                  onUpdateAddOn(addOn.id, {
                    ...addOn,
                    name: event.target.value,
                  })
                }
              />
              <TextInput
                label="Price"
                placeholder="50"
                value={addOn.price}
                onChange={(event) =>
                  onUpdateAddOn(addOn.id, {
                    ...addOn,
                    price: event.target.value,
                  })
                }
              />
              <div className="flex flex-col gap-2">
                <TextArea
                  label="Description"
                  rows={2}
                  placeholder="Includes extended appointment and priority scheduling."
                  value={addOn.description}
                  onChange={(event) =>
                    onUpdateAddOn(addOn.id, {
                      ...addOn,
                      description: event.target.value,
                    })
                  }
                />
                <div className="text-right">
                  <IconButton
                    label="Remove"
                    icon={Trash2}
                    onClick={() => onRemoveAddOn(addOn.id)}
                    variant="ghost"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default memo(ServicesSection);
