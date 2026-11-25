import type { Metadata } from "next";
import Link from "next/link";
import { LegalContactValue } from "@/components/site/legal-contact-value";
import {
  LegalPage,
  LegalPlaceholder,
  LegalSection,
} from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du site officiel de Voice Talent – Édition spéciale Douala 2026.",
};

export default function LegalNoticesPage() {
  return (
    <LegalPage
      title="Mentions légales"
      intro="Les présentes mentions légales encadrent l'utilisation du site officiel de Voice Talent – Édition spéciale Douala 2026."
    >
      <LegalSection title="1. Éditeur du site">
        <p>Le présent site est édité par :</p>
        <ul>
          <li>
            Raison sociale : <LegalPlaceholder />
          </li>
          <li>
            Adresse du siège social : <LegalContactValue field="address" />
          </li>
          <li>
            Immatriculation (RCCM / NIU) : <LegalPlaceholder />
          </li>
          <li>
            Directeur de la publication : <LegalPlaceholder />
          </li>
          <li>
            E-mail de contact : <LegalContactValue field="email" />
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Hébergement">
        <ul>
          <li>Hébergement du site : Vercel Inc. (vercel.com).</li>
          <li>Base de données et fichiers : Supabase Inc. (supabase.com).</li>
        </ul>
        <p>
          Les données traitées par ces prestataires techniques sont décrites
          dans la{" "}
          <Link href="/confidentialite" className="text-flame-100 underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="3. Propriété intellectuelle">
        <p>
          La dénomination Voice Talent, le logo, la charte graphique ainsi que
          l'ensemble des contenus publiés sur le site (textes, visuels, éléments
          sonores et audiovisuels) sont la propriété de l'organisation ou de ses
          partenaires. Toute reproduction, représentation ou diffusion, totale
          ou partielle, sans autorisation écrite préalable est interdite.
        </p>
      </LegalSection>

      <LegalSection title="4. Contenu du site">
        <p>
          Les informations publiées (calendrier, phases de la compétition,
          modalités de vote et de billetterie) sont fournies à titre indicatif
          et peuvent être modifiées par l'organisation à tout moment. Le
          calendrier annoncé sur le site est un calendrier prévisionnel.
        </p>
      </LegalSection>

      <LegalSection title="5. Responsabilité">
        <p>
          L'organisation s'efforce d'assurer l'exactitude et la disponibilité du
          site. Elle ne saurait être tenue responsable des dommages directs ou
          indirects résultant de l'accès ou de l'utilisation du site, d'une
          interruption de service, ni du contenu des sites tiers vers lesquels
          le site renvoie.
        </p>
      </LegalSection>

      <LegalSection title="6. Données à caractère personnel">
        <p>
          Le traitement des données personnelles est détaillé dans la{" "}
          <Link href="/confidentialite" className="text-flame-100 underline">
            politique de confidentialité
          </Link>{" "}
          et les conditions d'utilisation du site dans les{" "}
          <Link href="/cgu" className="text-flame-100 underline">
            conditions générales
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="7. Contact">
        <p>
          Pour toute demande relative au site :{" "}
          <LegalContactValue field="email" />
        </p>
      </LegalSection>

      <LegalSection title="8. Droit applicable">
        <p>
          Les présentes mentions légales sont régies par le droit camerounais. À
          défaut de résolution amiable, tout litige relève de la compétence des
          tribunaux de Douala.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
