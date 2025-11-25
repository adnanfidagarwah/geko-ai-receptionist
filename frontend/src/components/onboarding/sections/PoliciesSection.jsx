import React, { memo } from "react";
import { TextArea, TextInput, Toggle } from "../FormControls";

const PoliciesSection = ({
  emergencyScript,
  onEmergencyScriptChange,
  privacyMode,
  onTogglePrivacyMode,
  privacyPolicyUrl,
  onPrivacyPolicyUrlChange,
  consentText,
  onConsentTextChange,
  notificationPrefs,
  onToggleNotification,
}) => (
  <div className="space-y-5">
    <TextArea
      label="Emergency script"
      rows={3}
      placeholder="If this is a medical emergency, hang up and dial 911..."
      value={emergencyScript}
      onChange={(event) => onEmergencyScriptChange(event.target.value)}
    />

    <Toggle
      label="Allow personal data persistence (privacy mode)"
      enabled={privacyMode}
      onToggle={onTogglePrivacyMode}
    />

    <TextInput
      label="Privacy policy URL"
      placeholder="https://example.com/privacy"
      value={privacyPolicyUrl}
      onChange={(event) => onPrivacyPolicyUrlChange(event.target.value)}
    />

    <TextArea
      label="Consent text for storing contact details/voicemails"
      rows={3}
      placeholder="By leaving a voicemail you consent to..."
      value={consentText}
      onChange={(event) => onConsentTextChange(event.target.value)}
    />

    <div className="space-y-3 rounded-2xl border border-background-hover bg-background-hover/80 p-5 shadow-inner">
      <h3 className="text-sm font-semibold text-primary-dark">
        Confirmation channels
      </h3>
      <div className="grid gap-3 md:grid-cols-3">
        <Toggle
          label="SMS confirmations"
          enabled={notificationPrefs.sms}
          onToggle={() => onToggleNotification("sms")}
        />
        <Toggle
          label="WhatsApp confirmations"
          enabled={notificationPrefs.whatsapp}
          onToggle={() => onToggleNotification("whatsapp")}
        />
        <Toggle
          label="Email confirmations"
          enabled={notificationPrefs.email}
          onToggle={() => onToggleNotification("email")}
        />
      </div>
    </div>
  </div>
);

export default memo(PoliciesSection);
