"use client";

import { useServerClock } from "@/lib/use-server-clock";

export type Deadline = { at: string; label: string };

function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/** Affiche la prochaine échéance non dépassée parmi `deadlines`. */
export function Countdown({
  deadlines,
  endedLabel,
}: {
  deadlines: Deadline[];
  endedLabel?: string;
}) {
  const { now, synced } = useServerClock();
  const next = deadlines.find(
    (deadline) => new Date(deadline.at).getTime() > now,
  );

  if (!synced) {
    return (
      <div
        className="h-32 animate-pulse rounded-lg bg-night-900"
        aria-hidden="true"
      />
    );
  }
  if (!next) {
    return endedLabel ? (
      <p className="text-lg font-semibold text-muted">{endedLabel}</p>
    ) : null;
  }

  const parts = splitDuration(new Date(next.at).getTime() - now);
  const units = [
    { value: parts.days, label: "jours" },
    { value: parts.hours, label: "heures" },
    { value: parts.minutes, label: "minutes" },
    { value: parts.seconds, label: "secondes" },
  ];

  return (
    <div>
      <p className="vt-chip mb-4">{next.label}</p>
      <div
        className="grid grid-cols-4 gap-2 sm:gap-4"
        role="timer"
        aria-live="off"
        aria-label={`${next.label} : ${parts.days} jours, ${parts.hours} heures, ${parts.minutes} minutes, ${parts.seconds} secondes`}
      >
        {units.map((unit) => (
          <div
            key={unit.label}
            className="vt-panel rounded-md px-1 py-3 text-center sm:py-4"
          >
            {/* La clé force le remontage du chiffre : l'animation de rebond se rejoue à chaque variation. */}
            <span
              key={unit.value}
              className="vt-digit block font-display text-4xl leading-none text-flame-100 tabular-nums sm:text-6xl"
            >
              {String(unit.value).padStart(2, "0")}
            </span>
            <span className="mt-1 block text-[0.68rem] tracking-[0.18em] text-muted uppercase sm:text-xs">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
