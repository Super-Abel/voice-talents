import Link from "next/link";

/* Sticker officiel de la marque, détouré de son fond photo (source :
   voice-talent-bridge/LOGO.jpeg). Le nom est déjà dessiné dans le graphisme,
   donc le lockup n'ajoute pas de texte par-dessus. */
const LOGO_SRC = "/brand/voice-talent-logo.webp";

export function Logo({ className = "h-11" }: { className?: string }) {
  return (
    <Link
      href="/"
      className="vt-mark-group flex items-center"
      aria-label="Voice Talent – accueil"
    >
      {/* Le projet n'a pas de sharp : next/image n'optimiserait rien de plus. */}
      {/* biome-ignore lint/performance/noImgElement: visuel pré-optimisé (320 px, 22 Ko). */}
      <img
        src={LOGO_SRC}
        alt="Voice Talent – The Bridge"
        width={320}
        height={177}
        decoding="async"
        className={`vt-mark w-auto ${className}`}
      />
    </Link>
  );
}
