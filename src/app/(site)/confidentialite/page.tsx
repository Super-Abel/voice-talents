import type { Metadata } from "next";
import {
  LegalPage,
  LegalPlaceholder,
  LegalSection,
} from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Confidentialité",
  description:
    "Politique de confidentialité de Voice Talent – Édition spéciale Douala 2026 : données collectées, finalités, durées de conservation et droits.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      intro="Cette politique décrit les données personnelles traitées par le site officiel de Voice Talent – Édition spéciale Douala 2026, les finalités poursuivies, les durées de conservation et les droits dont vous disposez."
    >
      <LegalSection title="1. Cadre légal">
        <p>
          Le traitement des données à caractère personnel réalisé sur ce site
          est conforme à la loi camerounaise n° 2024/017 du 23 décembre 2024
          relative à la protection des données à caractère personnel.
        </p>
      </LegalSection>

      <LegalSection title="2. Responsable du traitement">
        <ul>
          <li>
            Responsable du traitement : <LegalPlaceholder />
          </li>
          <li>
            Adresse : <LegalPlaceholder />
          </li>
          <li>
            E-mail de contact : <LegalPlaceholder />
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Données collectées">
        <ul>
          <li>
            Données d'identité : nom, prénom, nom de scène, date de naissance,
            sexe.
          </li>
          <li>
            Données de contact : numéro de téléphone, adresse e-mail, ville de
            résidence, personne à contacter (nom et numéro de téléphone).
          </li>
          <li>Photo de portrait.</li>
          <li>Vidéos des prestations.</li>
          <li>
            Données de vote et de billetterie : numéro de téléphone payeur,
            montant, référence de transaction. Ces données sont transmises par
            l'agrégateur de paiement ; aucune donnée bancaire n'est stockée sur
            le site.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Finalités du traitement">
        <ul>
          <li>Recevoir et examiner les candidatures.</li>
          <li>
            Organiser la compétition : convocations, calendrier, prestations,
            résultats.
          </li>
          <li>Enregistrer et comptabiliser le vote du public.</li>
          <li>Émettre et contrôler les billets d'accès aux émissions.</li>
          <li>Communiquer avec les candidats, les votants et le public.</li>
          <li>
            Joindre la personne de confiance indiquée par le candidat lorsque
            celui-ci est injoignable, notamment lors des convocations.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Base légale">
        <p>
          Le traitement repose sur le consentement explicite donné lors de
          l'inscription, matérialisé par la validation du dossier de candidature
          et l'acceptation des conditions générales.
        </p>
      </LegalSection>

      <LegalSection title="6. Destinataires des données">
        <ul>
          <li>
            L'équipe d'organisation habilitée, dans la limite de ses missions.
          </li>
          <li>
            Les prestataires techniques : hébergement du site (Vercel Inc.),
            base de données et fichiers (Supabase Inc.), routage des e-mails et
            agrégateur de paiement Mobile Money.
          </li>
        </ul>
        <p>
          Les données ne sont ni vendues, ni louées, ni cédées à des tiers à des
          fins commerciales.
        </p>
      </LegalSection>

      <LegalSection title="7. Durées de conservation">
        <ul>
          <li>
            Dossiers non retenus : supprimés 6 mois après la fin du concours.
          </li>
          <li>
            Dossiers retenus : conservés pendant la durée de la compétition,
            puis 1 an.
          </li>
          <li>
            Transactions de vote et de billetterie : conservées pendant la durée
            légale comptable applicable.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Vos droits">
        <p>
          Vous disposez d'un droit d'accès, de rectification, d'opposition et
          d'effacement portant sur les données qui vous concernent. Ces droits
          s'exercent par e-mail à l'adresse de contact : <LegalPlaceholder />
        </p>
        <p>
          Une pièce d'identité peut être demandée afin de vérifier l'identité du
          demandeur. L'exercice du droit d'opposition avant la clôture de la
          compétition peut rendre impossible la participation au concours.
        </p>
      </LegalSection>

      <LegalSection title="9. Sécurité">
        <ul>
          <li>
            Chiffrement des échanges (HTTPS) entre le navigateur et le site.
          </li>
          <li>
            Accès aux données strictement restreint aux comptes habilités de
            l'organisation.
          </li>
          <li>Journalisation des accès et des opérations d'administration.</li>
        </ul>
      </LegalSection>

      <LegalSection title="10. Publication des données">
        <p>
          Seuls la photo, le nom de scène et la présentation des 40 candidats
          retenus sont rendus publics sur le site, pour permettre le vote du
          public. Les coordonnées complètes, la personne à contacter et les
          enregistrements non diffusés ne sont jamais publiés.
        </p>
      </LegalSection>

      <LegalSection title="11. Mise à jour">
        <p>
          La présente politique peut être mise à jour pour rester conforme à la
          réglementation camerounaise. La version en vigueur est celle publiée
          sur le site.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
