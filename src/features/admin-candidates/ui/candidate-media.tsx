"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Le média ne descend du backend que quand le regard l'atteint : parcourir la
 * file du jury ne coûte plus dix vidéos de 10 Mo chargées d'avance.
 */
function useArmed(rootMargin = "600px 0px") {
  const ref = useRef<HTMLDivElement | null>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || armed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setArmed(true);
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [armed, rootMargin]);

  return { ref, armed };
}

const ALERT =
  "rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger";

/**
 * Lecture directe du fichier tel que le backend le sert : l'URL signée accepte
 * les requêtes partielles, donc le navigateur décode progressivement et cherche
 * sans jamais retélécharger la pièce.
 */
export function CandidateVideo({ src }: { src: string }) {
  const { ref, armed } = useArmed();
  const [technical, setTechnical] = useState("");
  const [failed, setFailed] = useState(false);

  return (
    <div ref={ref} className="space-y-2">
      {armed && !failed ? (
        <>
          {/* biome-ignore lint/a11y/useMediaCaption: prestation brute du candidat, sans sous-titres */}
          <video
            src={src}
            controls
            playsInline
            preload="metadata"
            className="w-full rounded-md bg-night-950"
            onLoadedMetadata={(event) => {
              const { videoWidth, videoHeight, duration } = event.currentTarget;
              setTechnical(
                `${videoWidth} × ${videoHeight} · ${duration.toFixed(1)} s`,
              );
            }}
            onError={() => setFailed(true)}
          />
          {technical && <p className="field-hint">{technical}</p>}
        </>
      ) : null}

      {armed && failed ? (
        <p role="alert" className={ALERT}>
          Ce navigateur ne décode pas ce fichier, ou le lien de lecture a
          expiré.{" "}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="font-medium underline"
          >
            Recharger la fiche
          </button>{" "}
          ou{" "}
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline"
          >
            ouvrir la prestation dans un autre onglet
          </a>{" "}
          pour la lire avec un lecteur vidéo.
        </p>
      ) : null}

      {!armed ? (
        <p className="field-hint">
          Vidéo non téléchargée : elle se chargera à l&apos;écran.
        </p>
      ) : null}
    </div>
  );
}

/** Le portrait pèse peu mais se charge à la demande, comme la prestation. */
export function CandidatePhoto({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed)
    return (
      <p role="alert" className={ALERT}>
        Portrait illisible : rechargez la fiche pour un lien frais.
      </p>
    );

  return (
    // biome-ignore lint/performance/noImgElement: URL signée du backend, non optimisable par next/image
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
