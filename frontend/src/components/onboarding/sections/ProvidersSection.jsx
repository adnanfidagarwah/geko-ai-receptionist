import React, { memo } from "react";
import { Plus } from "lucide-react";
import { IconButton } from "../FormControls";
import ProviderCard from "../ProviderCard";

const ProvidersSection = ({
  providers,
  onUpdateProvider,
  onRemoveProvider,
  onAddProvider,
}) => (
  <div className="space-y-5">
    {providers.map((provider) => (
      <ProviderCard
        key={provider.id}
        provider={provider}
        onChange={(nextProvider) => onUpdateProvider(provider.id, nextProvider)}
        onRemove={() => onRemoveProvider(provider.id)}
        canRemove={providers.length > 1}
      />
    ))}
    <IconButton label="Add provider" icon={Plus} onClick={onAddProvider} />
  </div>
);

export default memo(ProvidersSection);
