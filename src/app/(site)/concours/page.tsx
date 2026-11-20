import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SectionHeading } from "@/components/site/section-heading";
import { getCachedSettings } from "@/features/settings/infrastructure/settings-repository";

export const metadata: Metadata = {
  title: "Le concours",
  description:
    "Phases, jury, vote du public et règlement de Voice Talent – Édition spéciale Douala 2026, de la première émission à la grande finale.",
};

const PHASES = [
  {
    title: "Première phase",
    text: "Prestations libres : 4 émissions de 10 candidats, à l'issue desquelles 24 candidats sont qualifiés.",
  },
  {
    title: "Battles",
    text: "12 duels sur des titres imposés : les 12 vainqueurs accèdent à la demi-finale.",
  },
  {
    title: "Demi-finale",
    text: "Les 12 demi-finalistes se disputent les 6 places de finaliste.",
  },
  {
    title: "Grande finale",
    text: "Les 6 finalistes se rencontrent sur une dernière émission : le jury désigne la voix de l'édition.",
  },
];

const VOTE_WEIGHTS = [
  {
    phase: "Première phase (prestations libres)",
    public: "60 %",
    jury: "40 %",
  },
  { phase: "Battles", public: "—", jury: "100 %" },
  { phase: "Demi-finale", public: "60 %", jury: "40 %" },
  { phase: "Grande finale", public: "—", jury: "100 %" },
];

const RULES = [
  "Avoir entre 18 et 35 ans révolus à la date de clôture des inscriptions.",
  "L'inscription est gratuite et limitée à un seul dossier par personne : le téléphone et l'adresse e-mail doivent être uniques.",
  "Les inscriptions sont ouvertes du 21/11/2026 à 00 h 00 au 27/11/2026 à 23 h 59 (heure de Douala) ; aucune inscription hors délai n'est acceptée.",
  "Les informations fournies doivent être exactes : toute fausse déclaration entraîne l'exclusion du candidat.",
  "Le casting en ligne se tient le 28/11/2026 ; 40 candidats sont retenus.",
  "Chaque candidat respecte le calendrier et les consignes de l'organisation.",
  "Les décisions du jury sont souveraines.",
  "L'organisation peut utiliser l'image et les prestations des candidats pour la promotion du concours.",
  "Toute fraude au vote entraîne l'annulation des votes concernés.",
];

export default function ContestPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-5xl tracking-wide sm:text-6xl">
        Le concours
      </h1>
      <p className="mt-3 text-muted">
        Voice Talent – Édition spéciale Douala suit 40 candidats de 18 à 35 ans,
        de la première émission de décembre 2026 à la grande finale du 30
        janvier 2027.
      </p>

      <div className="mt-10 space-y-14">
        <section id="phases" className="scroll-mt-24">
          <SectionHeading intro="Quatre étapes, autant de rendez-vous avec le public.">
            Les phases
          </SectionHeading>
          <ul className="grid gap-4 sm:grid-cols-2">
            {PHASES.map((phase, index) => (
              <li key={phase.title} className="card">
                <span
                  className="font-display text-3xl leading-none text-night-600"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display text-2xl tracking-wide">
                  {phase.title}
                </h3>
                <p className="mt-2 text-muted">{phase.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="jury" className="scroll-mt-24">
          <SectionHeading>Le jury</SectionHeading>
          <div className="card">
            <p className="text-muted">
              Un jury de 2 membres note les prestations, accompagné d'un coach
              qui encadre les candidats tout au long de la compétition. Les noms
              et les photos seront communiqués prochainement.
            </p>
          </div>
        </section>

        <section id="vote" className="scroll-mt-24">
          <SectionHeading intro="Le score final combine le vote du public et la note du jury.">
            Vote et notation
          </SectionHeading>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[24rem] border-collapse text-sm">
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
                      className="py-3 pr-3 text-left font-medium text-ink"
                    >
                      {row.phase}
                    </th>
                    <td className="px-3 py-3 text-muted">{row.public}</td>
                    <td className="py-3 pl-3 text-muted">{row.jury}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm text-muted">
            — : le vote du public n'est pas ouvert pour cette phase.
          </p>

          <ul className="mt-6 list-disc space-y-2 pl-5 text-muted">
            <li>
              Le vote du public a lieu uniquement sur le site officiel, pendant
              la première phase et la demi-finale.
            </li>
            <li>
              Score final : 60 % pour la part du public, 40 % pour la note du
              jury.
            </li>
            <li>
              Les égalités sont départagées par la note du jury, puis par le
              nombre de votes.
            </li>
          </ul>

          <div className="card mt-6">
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

        <section id="reglement" className="scroll-mt-24">
          <SectionHeading>Le règlement</SectionHeading>
          <ol className="list-decimal space-y-2 pl-5 text-muted">
            {RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted">
            Version provisoire – le règlement officiel complet sera publié par
            l'organisation.
          </p>
        </section>
      </div>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Link href="/inscription" className="btn-flame w-full sm:w-auto">
          S'inscrire gratuitement
        </Link>
        <Link href="/contact" className="btn-ghost w-full sm:w-auto">
          Contacter l'organisation
        </Link>
      </div>
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
