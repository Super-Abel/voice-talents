"use client";

import { useEffect, useState } from "react";

/**
 * Heure du serveur côté navigateur : l'horloge de l'appareil n'est utilisée que
 * pour faire avancer le compte à rebours, corrigée par le décalage mesuré via /api/time.
 */
export function useServerClock(tickMs = 1000): {
  now: number;
  synced: boolean;
} {
  const [offset, setOffset] = useState<number | null>(null);
  const [deviceNow, setDeviceNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      const sentAt = Date.now();
      try {
        const response = await fetch("/api/time", { cache: "no-store" });
        const { now } = (await response.json()) as { now: number };
        const receivedAt = Date.now();
        if (!cancelled) setOffset(now - (sentAt + receivedAt) / 2);
      } catch {
        if (!cancelled) setOffset((current) => current ?? 0);
      }
    };
    void sync();
    const resync = window.setInterval(sync, 5 * 60 * 1000);
    const onVisible = () =>
      document.visibilityState === "visible" && void sync();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(resync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setDeviceNow(Date.now()), tickMs);
    return () => window.clearInterval(timer);
  }, [tickMs]);

  return { now: deviceNow + (offset ?? 0), synced: offset !== null };
}
