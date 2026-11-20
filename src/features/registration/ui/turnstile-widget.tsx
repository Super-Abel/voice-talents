"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Rendu uniquement si une clé Turnstile est configurée. */
export function TurnstileWidget({
  onToken,
}: {
  onToken: (token: string | undefined) => void;
}) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !container.current) return;
    let widgetId: string | undefined;
    const render = () => {
      if (!container.current || !window.turnstile) return;
      widgetId = window.turnstile.render(container.current, {
        sitekey: SITE_KEY,
        language: "fr",
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(undefined),
      });
    };
    if (window.turnstile) render();
    else {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    }
    return () => {
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [onToken]);

  return SITE_KEY ? <div ref={container} /> : null;
}
