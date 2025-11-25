import { useState } from "react";
import clsx from "clsx";

export default function Tabs({ tabs = [] }) {
  const [active, setActive] = useState(tabs[0]?.key);

  const ActiveContent = tabs.find((tab) => tab.key === active)?.content;

  return (
    <div className="card">
      {/* Tabs Header */}
      <div className="flex bg-background-hover rounded-full p-1 w-fit mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors",
              active === tab.key
                ? "bg-background-card text-primary shadow-sm"
                : "text-textcolor-secondary hover:text-primary"
            )}
          >
            {tab.icon && <tab.icon className="h-4 w-4" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div>{ActiveContent}</div>
    </div>
  );
}
