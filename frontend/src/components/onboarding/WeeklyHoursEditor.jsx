import React, { memo, useMemo } from "react";

const WeeklyHoursEditor = ({ value, onChange, days = [] }) => {
  const memoizedDays = useMemo(() => days, [days]);

  const updateDay = (day, field, nextValue) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        [field]: nextValue,
      },
    });
  };

  const toggleClosed = (day) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        closed: !value[day].closed,
      },
    });
  };

  return (
    <div className="space-y-3">
      {memoizedDays.map((day) => {
        const dayHours = value[day] ?? { open: "", close: "", closed: false };
        return (
          <div
            key={day}
            className="grid items-center gap-3 rounded-xl border border-background-hover bg-white/80 px-4 py-3 shadow-sm md:grid-cols-[120px,repeat(2,minmax(0,1fr)),auto]"
          >
            <span className="text-sm font-medium text-textcolor-secondary">{day}</span>
            <input
              type="time"
              disabled={dayHours.closed}
              value={dayHours.open}
              onChange={(event) => updateDay(day, "open", event.target.value)}
              className="rounded-lg border border-background-hover bg-white px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-background-hover"
            />
            <input
              type="time"
              disabled={dayHours.closed}
              value={dayHours.close}
              onChange={(event) => updateDay(day, "close", event.target.value)}
              className="rounded-lg border border-background-hover bg-white px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-background-hover"
            />
            <button
              type="button"
              onClick={() => toggleClosed(day)}
              className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                dayHours.closed
                  ? "border-error/30 bg-error/10 text-error hover:border-error/40"
                  : "border-background-hover bg-white text-textcolor-secondary hover:border-accent/40"
              }`}
            >
              {dayHours.closed ? "Closed" : "Open"}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default memo(WeeklyHoursEditor);
