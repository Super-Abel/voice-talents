import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Countdown } from "@/components/countdown";
import { CountUp } from "@/components/site/motion/count-up";
import { HeroTilt, KineticTitle } from "@/components/site/motion/kinetics";
import { Reveal } from "@/components/site/motion/reveal";
import {
  Equalizer,
  StageBeams,
  StageTexture,
} from "@/components/site/motion/stage";
import { Ticker } from "@/components/site/motion/ticker";
import { SectionHeading } from "@/components/site/section-heading";
import { getCachedSettings } from "@/features/settings/infrastructure/settings-repository";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = {
  title: "Accueil",
  description:
    "Voice Talent – Édition spéciale Douala : la compétition qui révèle les nouvelles voix du Cameroun. 40 candidats de 18 à 35 ans, de décembre 2026 à janvier 2027.",
};

const TICKER_ITEMS = [
  "Inscriptions gratuites",
  "21 → 27 novembre 2026",
  "Casting en ligne 28 novembre",
  "Lancement officiel 5 décembre",
  "500 000 FCFA à gagner",
  "Douala · Cameroun",
  "Vote du public 100 FCFA",
] as const;

const HERO_STATS = [
  { value: "40", label: "Candidats" },
  { value: "18 → 35", label: "Ans" },
  { value: "8", label: "Émissions" },
  { value: "500 000", label: "FCFA à gagner" },
] as const;

const HERO_DATES = [
  { label: "Inscriptions", value: "21 → 27 nov. 2026" },
  { label: "Casting en ligne", value: "28 nov. 2026" },
  { label: "Lancement", value: "5 déc. 2026" },
  { label: "Première émission", value: "12 déc. 2026" },
  { label: "Grande finale", value: "30 janv. 2027" },
] as const;

const PHASES = [
  {
    n: "01",
    title: "Prestations libres",
    dates: "12 → 27 déc. 2026",
    text: "40 candidats répartis en quatre émissions de 10. Chacun interprète la chanson de son choix.",
    outcome: "24 qualifiés",
    split: "Public 60 % · Jury 40 %",
  },
  {
    n: "02",
    title: "Les battles",
    dates: "3 → 9 janv. 2027",
    text: "12 duels sur un titre imposé par la direction artistique, répartis sur deux émissions.",
    outcome: "12 qualifiés",
    split: "Jury 100 %",
  },
  {
    n: "03",
    title: "La demi-finale",
    dates: "17 janv. 2027",
    text: "Les 12 demi-finalistes reprennent un titre imposé. Seules six voix décrochent leur place en finale.",
    outcome: "6 finalistes",
    split: "Public 60 % · Jury 40 %",
  },
  {
    n: "04",
    title: "La grande finale",
    dates: "30 janv. 2027",
    text: "Les six finalistes s'affrontent une dernière fois : le jury désigne la voix de l'édition.",
    outcome: "1 grand gagnant",
    split: "Jury 100 %",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Je m'inscris",
    period: "21 → 27 novembre 2026",
    text: "Dossier gratuit en ligne : identité, photo et un enregistrement de votre voix.",
  },
  {
    n: "02",
    title: "Casting en ligne",
    period: "28 novembre 2026",
    text: "Le jury écoute les prestations et retient 40 candidats.",
  },
  {
    n: "03",
    title: "En compétition",
    period: "Décembre 2026 → janvier 2027",
    text: "Les émissions s'enchaînent jusqu'à la finale, et le public vote pour ses voix préférées.",
  },
] as const;

const SCHEDULE = [
  { period: "21 – 27 novembre 2026", title: "Ouverture des inscriptions" },
  { period: "28 novembre 2026", title: "Casting en ligne" },
  {
    period: "5 décembre 2026",
    title: "Cérémonie de lancement et ouverture de la billetterie",
  },
  { period: "12 – 27 décembre 2026", title: "Première phase · 4 émissions" },
  { period: "3 – 9 janvier 2027", title: "Battles · 2 émissions" },
  { period: "17 janvier 2027", title: "Demi-finale" },
  { period: "30 janvier 2027", title: "Grande finale" },
] as const;

const TICKETS = [
  { event: "Première phase", category: "Standard", price: 1000 },
  { event: "Battles", category: "Standard", price: 1000 },
  { event: "Demi-finale", category: "Standard", price: 2000 },
  { event: "Demi-finale", category: "VIP", price: 5000 },
  { event: "Grande finale", category: "Standard", price: 3000 },
  { event: "Grande finale", category: "VIP", price: 5000 },
  { event: "Grande finale", category: "VIP Premium", price: 10000 },
] as const;

const JURY_CARDS = [
  {
    role: "Jury",
    title: "Deux voix expertes",
    text: "Deux membres notent les prestations : 40 % du score, et 100 % lors des battles et de la finale.",
  },
  {
    role: "Coach",
    title: "Un accompagnement",
    text: "Un coach suit les 40 candidats retenus, du premier plateau jusqu'à la grande finale.",
  },
  {
    role: "Bientôt",
    title: "Noms et photos",
    text: "Le jury et le coach seront présentés à la cérémonie de lancement du 5 décembre 2026.",
  },
] as const;

/* Visuels réels de la saison précédente, repris de l'ancien site (voice-talent-bridge). */
const PREVIOUS_FINALISTS = [
  {
    name: "Andy",
    rank: "1er finaliste",
    src: "/media/finalistes/andy.webp",
    position: "center 26%",
  },
  {
    name: "Grace",
    rank: "2e finaliste",
    src: "/media/finalistes/grace.webp",
    position: "center 24%",
  },
  {
    name: "Cheera",
    rank: "3e finaliste",
    src: "/media/finalistes/cheera.webp",
    position: "center 30%",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TickerBand />
      <PhasesSection />
      <PrizeSection />
      <StepsSection />
      <VoteSection />
      <CalendarSection />
      <JurySection />
      <LegacySection />
      <Suspense fallback={null}>
        <SponsorsSection />
      </Suspense>
      <FinalCtaSection />
    </>
  );
}

function HeroSection() {
  return (
    <section className="vt-stage relative border-b border-night-800">
      <StageBeams />
      <StageTexture speedlines />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
        <HeroTilt depth={18}>
          <div className="vt-layer-far">
            <p className="vt-chip">
              <span className="text-flame-100">●</span> Douala · Cameroun
            </p>
          </div>

          <div className="vt-layer-near relative mt-5">
            <KineticTitle
              lines={["Voice", "Talent"]}
              accentLine={1}
              scramble="40 voix · une scène"
              className="text-[clamp(3.4rem,15vw,8.5rem)]"
            />
          </div>

          <p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">
            L'édition spéciale révèle les nouvelles voix du Cameroun : 40
            candidats de 18 à 35 ans, huit émissions, une seule scène pour
            passer de l'anonymat aux projecteurs.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/inscription" className="btn-flame w-full sm:w-auto">
              S'inscrire gratuitement
            </Link>
            <Link href="/concours" className="btn-ghost w-full sm:w-auto">
              Découvrir le concours
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
            {HERO_STATS.map((stat) => (
              <li key={stat.label}>
                <p className="font-display text-3xl leading-none text-ink sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs tracking-[0.16em] text-muted uppercase">
                  {stat.label}
                </p>
              </li>
            ))}
          </ul>
        </HeroTilt>

        <aside className="vt-panel relative p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl tracking-wide text-ink uppercase">
              Prochain rendez-vous
            </h2>
            <Equalizer bars={9} className="vt-float" />
          </div>
          <div className="mt-6">
            <Suspense fallback={<CountdownSkeleton />}>
              <HeroCountdown />
            </Suspense>
          </div>
          <dl className="mt-8 space-y-2.5 text-sm">
            {HERO_DATES.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-4 border-b border-night-800 pb-2.5 last:border-0 last:pb-0"
              >
                <dt className="text-muted">{row.label}</dt>
                <dd className="font-medium text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}

function TickerBand() {
  return (
    <div className="border-b border-night-800 bg-night-900/40 py-4">
      <Ticker items={TICKER_ITEMS} />
    </div>
  );
}

async function HeroCountdown() {
  const settings = await getCachedSettings();
  return (
    <Countdown
      deadlines={[
        {
          at: settings.registration_opens_at,
          label: "Ouverture des inscriptions dans",
        },
        {
          at: settings.registration_closes_at,
          label: "Clôture des inscriptions dans",
        },
        {
          at: `${settings.casting_date}T00:00:00+01:00`,
          label: "Casting en ligne dans",
        },
        {
          at: "2026-12-05T18:00:00+01:00",
          label: "Cérémonie de lancement dans",
        },
        {
          at: "2026-12-12T19:00:00+01:00",
          label: "Première émission dans",
        },
      ]}
      endedLabel="La compétition est lancée !"
    />
  );
}

function PhasesSection() {
  return (
    <section
      id="phases"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:py-24"
    >
      <SectionHeading
        eyebrow="Le déroulé"
        intro="Quatre temps, du plateau de décembre à la scène de la finale."
      >
        Les phases
      </SectionHeading>
      <ol className="grid gap-4 sm:grid-cols-2">
        {PHASES.map((phase, index) => (
          <li key={phase.n} className="h-full">
            <Reveal delay={index * 90} className="card group h-full">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <span
                  className="vt-outline font-display text-6xl leading-none sm:text-7xl"
                  aria-hidden="true"
                >
                  {phase.n}
                </span>
                <span className="vt-chip">{phase.dates}</span>
              </div>
              <h3 className="mt-4 font-display text-3xl tracking-wide">
                {phase.title}
              </h3>
              <p className="mt-2 text-muted">{phase.text}</p>
              <div
                className="vt-rule my-5 transition-[width] duration-500 group-hover:w-3/4"
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <p className="font-semibold text-flame-100">{phase.outcome}</p>
                <p className="text-muted">{phase.split}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PrizeSection() {
  return (
    <section
      id="recompense"
      className="vt-stage relative scroll-mt-24 border-y border-night-800 py-20 sm:py-28"
    >
      <StageBeams />
      <StageTexture />
      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <Reveal y={40}>
          <p className="vt-chip mx-auto">La récompense</p>
          <p className="mt-7 font-display text-[clamp(3.2rem,13vw,8rem)] leading-none">
            <Suspense fallback={<span>500 000</span>}>
              <PrizeAmount />
            </Suspense>
            <span className="text-gradient-flame"> FCFA</span>
          </p>
          <Suspense fallback={null}>
            <PrizeExtras />
          </Suspense>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/inscription" className="btn-flame w-full sm:w-auto">
              Tenter ma chance
            </Link>
            <Link
              href="/concours#reglement"
              className="btn-ghost w-full sm:w-auto"
            >
              Lire le règlement
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

async function PrizeAmount() {
  const { prize } = await getCachedSettings();
  return <CountUp value={prize.amount_xaf} />;
}

async function PrizeExtras() {
  const { prize } = await getCachedSettings();
  if (!prize.other.trim()) return null;
  return (
    <p className="mx-auto mt-5 max-w-xl text-lg text-muted">{prize.other}</p>
  );
}

function StepsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <SectionHeading
        eyebrow="Comment participer"
        intro="Trois étapes, de la candidature au direct."
      >
        Le parcours
      </SectionHeading>
      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.n} className="h-full">
            <Reveal delay={index * 110} className="card h-full">
              <span
                className="font-display text-5xl leading-none text-night-600"
                aria-hidden="true"
              >
                {step.n}
              </span>
              <h3 className="mt-3 font-display text-2xl tracking-wide">
                {step.title}
              </h3>
              <p className="mt-1 text-sm font-medium text-flame-100">
                {step.period}
              </p>
              <p className="mt-2 text-muted">{step.text}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}

function VoteSection() {
  return (
    <section
      id="vote"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:py-24"
    >
      <SectionHeading
        eyebrow="Le public décide"
        intro="Les votes du public sont ouverts pendant la première phase et la demi-finale, exclusivement sur le site officiel."
      >
        Voter et réserver sa place
      </SectionHeading>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal className="h-full">
          <div className="vt-panel h-full p-6 sm:p-8">
            <h3 className="font-display text-3xl tracking-wide text-ink uppercase">
              Le vote
            </h3>
            <p className="mt-3 text-muted">
              Un prix unique par vote, réglé par Mobile Money. Le score final
              mélange la salle et le jury.
            </p>
            <dl className="mt-7 grid grid-cols-2 gap-6">
              <div>
                <dt className="text-sm text-muted">Prix d'un vote</dt>
                <dd className="mt-1 font-display text-4xl leading-none text-flame-100">
                  <Suspense fallback={<span>100</span>}>
                    <VotePrice />
                  </Suspense>{" "}
                  <span className="text-xl">FCFA</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Répartition</dt>
                <dd className="mt-1 font-display text-4xl leading-none text-ink">
                  60 / 40
                </dd>
                <p className="mt-1 text-xs text-muted">
                  public 60 %, jury 40 %
                </p>
              </div>
            </dl>
            <ul className="mt-7 space-y-2 text-sm text-muted">
              <li>
                Battles et grande finale : le vote public est fermé, le jury
                tranche à 100 %.
              </li>
              <li>
                Les fenêtres d'ouverture et de fermeture des votes sont fixées
                par émission.
              </li>
              <li>
                Chaque vote est rattaché à une transaction confirmée et
                horodatée.
              </li>
            </ul>
          </div>
        </Reveal>

        <Reveal delay={120} className="h-full">
          <div id="billetterie" className="card h-full scroll-mt-24 p-6 sm:p-8">
            <h3 className="font-display text-3xl tracking-wide text-ink uppercase">
              La billetterie
            </h3>
            <p className="mt-3 text-muted">
              L'accès aux émissions se fait sur présentation d'un billet
              numérique avec QR code, à retrouver avec son numéro de téléphone.
            </p>
            <ul className="mt-6 divide-y divide-night-800">
              {TICKETS.map((ticket) => (
                <li
                  key={`${ticket.event}-${ticket.category}`}
                  className="flex items-baseline justify-between gap-4 py-2.5"
                >
                  <span className="text-ink">
                    {ticket.event}
                    <span className="text-muted"> · {ticket.category}</span>
                  </span>
                  <span className="font-display text-xl text-flame-100 tabular-nums">
                    {new Intl.NumberFormat("fr-FR").format(ticket.price)} FCFA
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-muted">
              Vente ouverte le 5 décembre 2026, le soir de la cérémonie de
              lancement.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

async function VotePrice() {
  const { vote_price_xaf } = await getCachedSettings();
  return <>{new Intl.NumberFormat("fr-FR").format(vote_price_xaf)}</>;
}

function CalendarSection() {
  return (
    <section
      id="calendrier"
      className="vt-stage relative scroll-mt-24 border-t border-night-800 py-16 sm:py-24"
    >
      <StageTexture />
      <div className="relative mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Les dates"
          intro="Calendrier indicatif, susceptible d'être ajusté par l'organisation."
        >
          Le calendrier
        </SectionHeading>
        <ol className="border-l border-night-700 pl-6 sm:pl-8">
          {SCHEDULE.map((item, index) => (
            <li key={item.title} className="relative pb-7 last:pb-0">
              <span
                className="absolute top-1.5 -left-[31px] size-3.5 rounded-full bg-flame-300 ring-4 ring-night-950 sm:-left-[39px]"
                aria-hidden="true"
              />
              <Reveal delay={index * 70} y={18}>
                <p className="text-sm font-semibold tracking-wide text-flame-100 uppercase">
                  {item.period}
                </p>
                <p className="mt-1 font-display text-2xl tracking-wide text-ink">
                  {item.title}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function JurySection() {
  return (
    <section
      id="jury"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:py-24"
    >
      <SectionHeading eyebrow="L'encadrement">
        Le jury et le coach
      </SectionHeading>
      <div className="grid gap-4 sm:grid-cols-3">
        {JURY_CARDS.map((card, index) => (
          <Reveal key={card.role} delay={index * 100} className="h-full">
            <article className="card h-full">
              <span
                className="vt-outline font-display text-3xl uppercase"
                aria-hidden="true"
              >
                {card.role}
              </span>
              <h3 className="mt-3 font-display text-2xl tracking-wide">
                {card.title}
              </h3>
              <p className="mt-2 text-muted">{card.text}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function LegacySection() {
  return (
    <section className="vt-stage relative border-t border-night-800 py-16 sm:py-24">
      <StageTexture />
      <div className="relative mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Saison précédente"
          intro="Trois voix ont ouvert le chemin à Douala. Cette édition cherche la suivante."
        >
          Les finalistes
        </SectionHeading>
        <ul className="grid gap-4 sm:grid-cols-3">
          {PREVIOUS_FINALISTS.map((person, index) => (
            <li key={person.name} className="h-full">
              <Reveal delay={index * 110} y={22} className="h-full">
                <figure className="vt-portrait h-full">
                  {/* Les visuels sont des webp déjà compressés servis depuis /public :
                      pas de sharp dans le projet, donc next/image n'apporterait rien. */}
                  {/* biome-ignore lint/performance/noImgElement: images pré-optimisées, sans dépendance d'optimisation runtime. */}
                  <img
                    src={person.src}
                    alt={`${person.name}, ${person.rank} de la saison précédente`}
                    width={1100}
                    height={733}
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: person.position }}
                  />
                  <figcaption>
                    <span className="vt-chip">{person.rank}</span>
                    <p className="vt-kinetic mt-2 text-3xl text-ink">
                      {person.name}
                    </p>
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

async function SponsorsSection() {
  const { sponsors } = await getCachedSettings();
  if (sponsors.length === 0) return null;
  return (
    <section className="border-t border-night-800">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading eyebrow="Ils soutiennent l'édition">
          Nos partenaires
        </SectionHeading>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((sponsor, index) => (
            <li key={sponsor.name} className="h-full">
              <Reveal
                delay={index * 60}
                className="card flex min-h-24 justify-center text-center"
              >
                {sponsor.url ? (
                  <a
                    href={sponsor.url}
                    className="font-medium text-ink hover:text-flame-100"
                    rel="noreferrer noopener"
                  >
                    {sponsor.name}
                  </a>
                ) : (
                  <span className="font-medium text-ink">{sponsor.name}</span>
                )}
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="vt-stage relative border-t border-night-800 py-20 sm:py-28">
      <StageBeams />
      <StageTexture speedlines />
      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <Reveal y={36}>
          <p className="vt-chip mx-auto">
            {formatDate("2026-11-21")} → {formatDate("2026-11-27")}
          </p>
          <h2 className="vt-kinetic mt-6 text-[clamp(2.6rem,10vw,5.5rem)] text-ink">
            Votre voix mérite
            <span className="text-gradient-flame block">la scène</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Inscription gratuite, un seul dossier par personne. Prévoyez une
            photo et l'enregistrement d'une prestation.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/inscription" className="btn-flame w-full sm:w-auto">
              S'inscrire gratuitement
            </Link>
            <Link
              href="/suivre-mon-dossier"
              className="btn-ghost w-full sm:w-auto"
            >
              Suivre mon dossier
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function CountdownSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3" aria-hidden="true">
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-md bg-night-900"
        />
      ))}
    </div>
  );
}
