import React from "react";
import { CheckCircle2, Headset, MessageSquare, FileText } from "lucide-react";
import { Badge } from "../ui/Badge";

const checklist = [
  "Scripts synced with AI receptionist",
  "Voicemail escalation rules updated",
  "Emergency triage phrases reviewed",
  "Pronunciation guide verified",
];

const resources = [
  {
    icon: Headset,
    title: "Live Escalation Desk",
    desc: "Route complex calls to senior staff in one tap.",
  },
  {
    icon: MessageSquare,
    title: "Greeting Library",
    desc: "Pre-approved greetings for every time slot.",
  },
  {
    icon: FileText,
    title: "Knowledge Base",
    desc: "Latest policy docs synced with AI prompts.",
  },
];

export default function StaffPlaybook() {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-lg backdrop-blur sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-textcolor">
              AI Collaboration Playbook
            </h2>
            <Badge variant="info" className="bg-accent/20">
              Updated today
            </Badge>
          </div>
          <p className="mt-1 text-sm text-textcolor-secondary">
            Keep staff and your AI receptionist aligned on tone, escalation, and
            compliance.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2 lg:gap-6">
        <div>
          <h3 className="text-sm font-semibold text-textcolor">
            Daily Alignment Checklist
          </h3>
          <ul className="mt-3 space-y-3 text-sm text-textcolor-secondary">
            {checklist.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 backdrop-blur-sm"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          {resources.map((resource) => (
            <div
              key={resource.title}
              className="flex items-start gap-3 rounded-xl border border-dashed border-white/50 bg-white/70 px-4 py-3 backdrop-blur-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                <resource.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-textcolor">
                  {resource.title}
                </p>
                <p className="text-xs text-textcolor-secondary">
                  {resource.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
