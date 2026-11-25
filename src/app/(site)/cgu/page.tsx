import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  LegalPage,
  LegalPlaceholder,
  LegalSection,
} from "@/components/site/legal-page";
import { registrationWindowSentence } from "@/features/settings/domain/date-labels";
import { getCachedSettings } from "@/features/settings/infrastructure/settings-repository";

export const metadata: Metadata = {
  title: "Conditions générales",
  description:
    "Conditions générales d'utilisation du site Voice Talent – Édition spéciale Douala 2026 : inscription, votes payants, billetterie.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Conditions générales d'utilisation et de vente"
      intro="Les présentes conditions régissent l'utilisation du site officiel de Voice Talent – Édition spéciale Douala 2026 : inscription au concours, vote du public et billetterie."
    >
      <LegalSection title="1. Objet">
        <p>
          Le site officiel est le seul canal permettant de déposer une
          candidature, de participer au vote du public et d'acheter un billet
          d'accès aux émissions. L'accès au site et son utilisation impliquent
          l'acceptation sans réserve des présentes conditions.
        </p>
      </LegalSection>

      <LegalSection title="2. Inscription au concours">
        <ul>
          <li>L'inscription est gratuite.</li>
          <li>
            Elle est réservée aux personnes âgées de 18 à 35 ans révolus à la
            date de clôture des inscriptions.
          </li>
          <li>
            Un seul dossier est admis par personne : le numéro de téléphone et
            l'adresse e-mail utilisés doivent être uniques.
          </li>
          <li>
            <Suspense
              fallback={
                <span className="inline-block h-4 w-64 animate-pulse rounded-md bg-night-800" />
              }
            >
              <RegistrationWindowClause />
            </Suspense>
          </li>
          <li>
            Le candidat garantit l'exactitude des informations fournies. Toute
            fausse déclaration entraîne l'exclusion.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Votes payants">
        <p>
          Le vote du public est ouvert uniquement sur le site officiel, pendant
          la première phase et la demi-finale. Chaque vote est payant :
        </p>
        <Suspense
          fallback={
            <div
              className="h-5 w-3/4 animate-pulse rounded bg-night-800"
              aria-hidden="true"
            />
          }
        >
          <VotePriceClause />
        </Suspense>
        <ul>
          <li>
            Un vote n'est comptabilisé qu'après confirmation du paiement par
            l'opérateur Mobile Money.
          </li>
          <li>
            Les votes ne sont pas remboursables, sauf échec technique imputable
            à l'organisation (paiement débité sans enregistrement du vote).
          </li>
          <li>
            Toute fraude au vote entraîne l'annulation des votes concernés, sans
            préjudice des autres mesures prévues par le règlement.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Moyens de paiement">
        <p>
          Les paiements sont effectués par Mobile Money (MTN MoMo, Orange Money)
          via un agrégateur de paiement. Aucune donnée bancaire n'est stockée
          sur le site.
        </p>
      </LegalSection>

      <LegalSection title="5. Billetterie">
        <ul>
          <li>
            Les billets d'accès aux émissions sont nominatifs et présentés sous
            forme de QR code.
          </li>
          <li>
            Chaque billet est à usage unique : il est invalidé après le premier
            contrôle d'accès.
          </li>
          <li>
            Les billets ne sont ni échangeables ni remboursables, sauf en cas
            d'annulation de l'émission par l'organisation.
          </li>
          <li>
            La revente de billets en dehors des canaux officiels est interdite.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Responsabilité">
        <p>
          L'organisation met en œuvre les moyens nécessaires pour assurer le bon
          déroulement de la compétition et le fonctionnement du site. Elle ne
          saurait être tenue responsable des dommages résultant d'une
          indisponibilité du réseau, d'un dysfonctionnement de l'opérateur de
          paiement, d'une utilisation frauduleuse du compte d'un tiers, ni d'un
          cas de force majeure. Le calendrier des émissions est prévisionnel et
          peut être modifié.
        </p>
      </LegalSection>

      <LegalSection title="7. Données personnelles">
        <p>
          Le traitement des données collectées à l'occasion de l'inscription, du
          vote et de la billetterie est décrit dans la{" "}
          <Link href="/confidentialite" className="text-flame-100 underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="8. Modification des conditions">
        <p>
          L'organisation peut modifier les présentes conditions afin de les
          adapter au déroulement de la compétition. La version applicable est
          celle en ligne sur le site au jour de l'utilisation.
        </p>
      </LegalSection>

      <LegalSection title="9. Droit applicable et juridictions compétentes">
        <p>
          Les présentes conditions sont régies par le droit camerounais. À
          défaut de résolution amiable, tout litige relève de la compétence
          exclusive des tribunaux de Douala.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          Pour toute question relative aux présentes conditions :{" "}
          <LegalPlaceholder />
        </p>
      </LegalSection>
    </LegalPage>
  );
}

async function RegistrationWindowClause() {
  const settings = await getCachedSettings();
  return (
    <>
      Les inscriptions sont ouvertes {registrationWindowSentence(settings)}
      (heure de Douala). Aucune inscription hors délai n&rsquo;est acceptée.
    </>
  );
}

async function VotePriceClause() {
  const { vote_price_xaf } = await getCachedSettings();
  return (
    <p>
      Prix unitaire d'un vote :{" "}
      <strong className="font-semibold text-ink">
        {new Intl.NumberFormat("fr-FR").format(vote_price_xaf)} FCFA
      </strong>
      , tel qu'affiché sur le site au moment du paiement.
    </p>
  );
}
