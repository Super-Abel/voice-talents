import type { Metadata } from "next";
import Link from "next/link";
import { type CSSProperties, Suspense } from "react";
import { KineticTitle } from "@/components/site/motion/kinetics";
import { Reveal } from "@/components/site/motion/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { getCachedSettings } from "@/features/settings/infrastructure/settings-repository";

export const metadata: Metadata = {
  title: "Le concours",
  description:
    "Phases, jury, vote du public et règlement de Voice Talent – Édition spéciale Douala 2026, de la première émission à la grande finale.",
};

const ANCHORS = [
  { href: "#phases", label: "Les phases" },
  { href: "#jury", label: "Le jury" },
  { href: "#vote", label: "Vote" },
  { href: "#reglement", label: "Règlement" },
];

const PHASES = [
  {
    title: "Première phase",
    dates: "12 – 27 décembre 2026",
    text: "Prestations libres : 4 émissions de 10 candidats, à l'issue desquelles 24 candidats sont qualifiés.",
  },
  {
    title: "Battles",
    dates: "3 – 9 janvier 2027",
    text: "12 duels sur des titres imposés : les 12 vainqueurs accèdent à la demi-finale.",
  },
  {
    title: "Demi-finale",
    dates: "17 janvier 2027",
    text: "Les 12 demi-finalistes se disputent les 6 places de finaliste.",
  },
  {
    title: "Grande finale",
    dates: "30 janvier 2027",
    text: "Les 6 finalistes se rencontrent sur une dernière émission : le jury désigne la voix de l'édition.",
  },
];

const VOTE_WEIGHTS = [
  {
    phase: "Première phase (prestations libres)",
    public: "60 %",
    jury: "40 %",
    publicShare: 60,
  },
  { phase: "Battles", public: "—", jury: "100 %", publicShare: 0 },
  { phase: "Demi-finale", public: "60 %", jury: "40 %", publicShare: 60 },
  { phase: "Grande finale", public: "—", jury: "100 %", publicShare: 0 },
];

const VOTE_NOTES = [
  "Le vote du public a lieu uniquement sur le site officiel, pendant la première phase et la demi-finale.",
  "Score final : 60 % pour la part du public, 40 % pour la note du jury.",
  "Les égalités sont départagées par la note du jury, puis par le nombre de votes.",
];

const RULES = [
  "Avoir entre 18 et 35 ans révolus à la date de clôture des inscriptions.",
  "L'inscription est gratuite et limitée à un seul dossier par personne : le téléphone et l'adresse e-mail doivent être uniques.",
  "Les inscriptions sont ouvertes du 25/11/2026 à 00 h 00 au 27/11/2026 à 23 h 59 (heure de Douala) ; aucune inscription hors délai n'est acceptée.",
  "Les informations fournies doivent être exactes : toute fausse déclaration entraîne l'exclusion du candidat.",
  "Le casting en ligne se tient le 28/11/2026 ; 40 candidats sont retenus.",
  "La vidéo de prestation déposée à l'inscription dure de 15 à 30 secondes et pèse 40 Mo maximum ; une vidéo hors ces limites n'est pas acceptée.",
  "Chaque candidat respecte le calendrier et les consignes de l'organisation.",
  "Les décisions du jury sont souveraines.",
  "L'organisation peut utiliser l'image et les prestations des candidats pour la promotion du concours.",
  "Toute fraude au vote entraîne l'annulation des votes concernés.",
];

export default function ContestPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="vt-chip">Édition spéciale Douala 2026</p>
      <KineticTitle
        className="mt-5 text-5xl sm:text-6xl"
        lines={["Le concours", "Douala 2026"]}
        accentLine={1}
      />
      <span className="vt-rule mt-5 block w-40" aria-hidden="true" />
      <p className="mt-5 text-muted">
        Voice Talent – Édition spéciale Douala suit 40 candidats de 18 à 35 ans,
        de la première émission de décembre 2026 à la grande finale du 30
        janvier 2027.
      </p>

      <nav aria-label="Sommaire" className="mt-8 flex flex-wrap gap-2">
        {ANCHORS.map((anchor) => (
          <Link
            key={anchor.href}
            href={anchor.href}
            className="vt-chip transition-colors hover:border-flame-200 hover:text-ink"
          >
            {anchor.label}
          </Link>
        ))}
      </nav>

      <div className="mt-12 space-y-16">
        <section id="phases" className="vt-scene scroll-mt-24">
          <SectionHeading intro="Quatre étapes, autant de rendez-vous avec le public.">
            Les phases
          </SectionHeading>
          <ul className="grid gap-4 sm:grid-cols-2">
            {PHASES.map((phase, index) => (
              <li key={phase.title} className="h-full">
                <Reveal delay={index * 90} y={22} className="h-full">
                  <article className="vt-panel relative h-full p-5">
                    <span
                      aria-hidden="true"
                      className="vt-outline font-display absolute top-0 right-3 text-7xl leading-none opacity-70"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="font-display text-sm tracking-[0.18em] text-flame-100 uppercase">
                      {phase.dates}
                    </p>
                    <h3 className="vt-kinetic mt-2 text-2xl text-ink">
                      <span style={{ "--vt-delay": "0ms" } as CSSProperties}>
                        {phase.title}
                      </span>
                    </h3>
                    <p className="mt-3 text-muted">{phase.text}</p>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        <section id="jury" className="vt-scene scroll-mt-24">
          <SectionHeading>Le jury</SectionHeading>
          <div className="vt-panel p-5 sm:p-6">
            <p className="text-muted">
              Un jury de 2 membres note les prestations, accompagné d'un coach
              qui encadre les candidats tout au long de la compétition. Les noms
              et les photos seront communiqués prochainement.
            </p>
          </div>
        </section>

        <section id="vote" className="vt-scene scroll-mt-24">
          <SectionHeading intro="Le score final combine le vote du public et la note du jury.">
            Vote et notation
          </SectionHeading>
          <div className="vt-panel overflow-x-auto p-4 sm:p-5">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <caption className="pb-3 text-left text-muted">
                Répartition des voix selon les phases
              </caption>
              <thead>
                <tr className="border-b border-night-700">
                  <th
                    scope="col"
                    className="py-2 pr-3 text-left font-semibold text-ink"
                  >
                    Phase
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left font-semibold text-ink"
                  >
                    Vote public
                  </th>
                  <th
                    scope="col"
                    className="py-2 pl-3 text-left font-semibold text-ink"
                  >
                    Vote jury
                  </th>
                </tr>
              </thead>
              <tbody>
                {VOTE_WEIGHTS.map((row) => (
                  <tr key={row.phase} className="border-b border-night-800">
                    <th
                      scope="row"
                      className="py-3 pr-3 text-left font-normal text-ink"
                    >
                      {row.phase}
                      <span
                        aria-hidden="true"
                        className="mt-2 flex h-1.5 w-36 overflow-clip rounded-full bg-night-800"
                      >
                        <span
                          className="h-full"
                          style={
                            {
                              width: `${row.publicShare}%`,
                              backgroundImage: "var(--gradient-flame)",
                            } as CSSProperties
                          }
                        />
                        <span className="h-full flex-1 bg-[#7b2cbf]" />
                      </span>
                    </th>
                    <td className="px-3 py-3 text-muted">{row.public}</td>
                    <td className="py-3 pl-3 text-muted">{row.jury}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted">
            — : le vote du public n'est pas ouvert pour cette phase.
          </p>

          <ul className="mt-6 space-y-3">
            {VOTE_NOTES.map((note) => (
              <li key={note} className="flex gap-3 text-muted">
                <span
                  aria-hidden="true"
                  className="mt-2 size-2 shrink-0 rotate-45 bg-flame-300"
                />
                <span className="leading-relaxed">{note}</span>
              </li>
            ))}
          </ul>

          <div className="vt-panel mt-6 p-5">
            <Suspense
              fallback={
                <div
                  className="h-6 w-2/3 animate-pulse rounded bg-night-800"
                  aria-hidden="true"
                />
              }
            >
              <VotePriceClause />
            </Suspense>
          </div>
        </section>

        <section id="reglement" className="vt-scene scroll-mt-24">
          <SectionHeading>Le règlement</SectionHeading>
          <ol className="vt-panel space-y-5 p-5 sm:p-6">
            {RULES.map((rule, index) => (
              <li key={rule} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="vt-outline font-display shrink-0 text-2xl leading-7"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="leading-relaxed text-muted">{rule}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted">
            Version provisoire – le règlement officiel complet sera publié par
            l'organisation.
          </p>
        </section>
      </div>

      <Reveal className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Link href="/inscription" className="btn-flame w-full sm:w-auto">
          S'inscrire gratuitement
        </Link>
        <Link href="/contact" className="btn-ghost w-full sm:w-auto">
          Contacter l'organisation
        </Link>
      </Reveal>
    </div>
  );
}

async function VotePriceClause() {
  const { vote_price_xaf } = await getCachedSettings();
  return (
    <p className="text-muted">
      Chaque vote coûte{" "}
      <strong className="font-semibold text-ink">
        {new Intl.NumberFormat("fr-FR").format(vote_price_xaf)} FCFA
      </strong>
      , réglé par Mobile Money (MTN MoMo, Orange Money).
    </p>
  );
}
