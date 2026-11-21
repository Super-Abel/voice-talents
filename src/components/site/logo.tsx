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
      {/* Le lockup affiche ~44 px de haut : 240 px de large suffit, et sharp est
          refusé par pnpm, donc next/image n'apporterait que des erreurs 500. */}
      {/* biome-ignore lint/performance/noImgElement: visuel 240 px, 10 Ko, déjà à taille. */}
      <img
        src={LOGO_SRC}
        alt="Voice Talent – The Bridge"
        width={240}
        height={132}
        decoding="async"
        className={`vt-mark w-auto ${className}`}
      />
    </Link>
  );
}
