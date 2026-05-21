# 📋 Rapport de Migration : Architecture Hexagonale & Base Multi-Tenant (V3 SaaS)

Ce rapport présente les accomplissements techniques majeurs réalisés pour transformer le projet **Voice Talents** en une plateforme **SaaS multi-tenant (B2B) hautement sécurisée, modulaire et 100 % cross-platform** (Web prioritaire, Android, iOS, Linux, et Desktop).

---

## 🎯 1. Synthèse Globale des Réalisations

La codebase a franchi un cap industriel majeur en passant d'une application simple à un **SaaS moderne de recrutement** structuré autour de :
1.  **Isolation Multi-Tenant (Logical Isolation)** : Toutes les données sont hermétiquement cloisonnées par organisation au niveau PostgreSQL grâce à la **Row Level Security (RLS)**.
2.  **Sécurité des Pièces Jointes Privées** : Protection totale du stockage via un bucket privé `saas_attachments`, avec **génération d'URLs signées à durée de vie restreinte (1h)** pour les recruteurs.
3.  **Refactoring d'Architecture Hexagonale (Ports & Adapteurs)** : Découplage absolu des règles métiers vis-à-vis des outils et SDK tiers (Supabase, FilePicker, UI).
4.  **Support Natif Cross-Platform** : Compatibilité instantanée avec le Web (via mémoire binaire `Uint8List`) et les plateformes natives Android, iOS, Linux et Desktop (via chargement de fichiers `io.File`).

---

## 🏛️ 2. L'Architecture Hexagonale (Ports et Adaptateurs)

L'architecture isole le **Cœur Métier (Domain)** des **Détails Techniques (Adapters)**. La couche **Infrastructure** est représentée par les adaptateurs secondaires.

```mermaid
graph TD
    subgraph Primary Adapters (Presentation)
        UI[Formulaire & Dashboard UI] --> Notifier[Riverpod Notifier]
    end
    subgraph Domain (Pure Core Business)
        Notifier --> InPort[Inbound Ports / Use Cases]
        InPort --> Service[Domain Services]
        Service --> Entity[Candidature Entity]
        Service --> OutPort[Outbound Ports / Repository Interfaces]
    end
    subgraph Secondary Adapters (Infrastructure Layer)
        OutPort --> InfraAdapter[Supabase & Storage Adapter]
        InfraAdapter --> SupabaseSDK[Supabase APIs]
    end
```

### 📂 Arborescence du Codebase Restructuré
Le module `candidature` est désormais structuré ainsi :

*   **`domain/` (Le Cœur Métier - 0 Dépendance Externe)**
    *   `entities/` : Contient l'entité pure `Candidature` et l'abstraction `DomainFile`.
    *   `ports/in/` : Définition des cas d'usage (interfaces pour l'UI).
    *   `ports/out/` : Contrats de persistance (interfaces pour l'infrastructure).
    *   `services/` : Implémentations pures des cas d'usage.
*   **`adapters/` (L'Infrastructure et l'UI)**
    *   `in/` : Riverpod Notifier qui gère les formulaires et pilote les cas d'usage.
    *   `out/` : **L'Adaptateur d'Infrastructure** qui dialogue avec Supabase et le stockage local.

---

## 🌐 3. Stratégie Cross-Platform (Web, Mobile, Desktop, Linux)

Afin d'éviter tout blocage de compilation sur le Web tout en préparant le support natif, nous avons implémenté l'agnosticité des fichiers via l'entité **`DomainFile`**.

### 💻 Sur le Web (Priorité Actuelle)
*   Le navigateur n'ayant pas d'accès direct au disque dur, les fichiers (vidéo de chant, photo d'identité) sont stockés sous forme de **mémoire binaire brute** (`Uint8List` via la propriété `bytes`).
*   L'infrastructure envoie les données binaires directement vers les serveurs Supabase via la commande `uploadBinary`.

### 📱 Sur Mobile (Android/iOS) & Desktop (Linux/Windows/macOS)
*   Les fichiers volumineux sont référencés par leur **chemin d'accès local** (`path`).
*   L'infrastructure instancie un fichier `io.File(path)` pour uploader les fichiers sous forme de flux (évitant ainsi de saturer la mémoire RAM).

---

## 📁 4. Cartographie des Fichiers Écrits dans la Codebase

Tous les fichiers suivants ont été rédigés et sauvegardés localement :

| Emplacement du Fichier | Type de Composant | Description |
| :--- | :--- | :--- |
| [`domain/entities/domain_file.dart`](file:///d:/Projet%20flutter/candidature/lib/features/candidature/domain/entities/domain_file.dart) | **Entité Métier** | Abstraction universelle de fichier (bytes pour le web, path pour le natif). |
| [`domain/entities/candidature.dart`](file:///d:/Projet%20flutter/candidature/lib/features/candidature/domain/entities/candidature.dart) | **Entité Métier** | Modèle candidat pur, libéré de toute dépendance de package tiers. |
| [`domain/ports/in/save_candidature_use_case.dart`](file:///d:/Projet%20flutter/candidature/lib/features/candidature/domain/ports/in/save_candidature_use_case.dart) | **Port d'Entrée** | Interface de cas d'usage pour soumettre un dossier de candidature. |
| [`domain/ports/in/get_candidatures_use_case.dart`](file:///d:/Projet%20flutter/candidature/lib/features/candidature/domain/ports/in/get_candidatures_use_case.dart) | **Port d'Entrée** | Interface de cas d'usage pour récupérer l'ensemble des dossiers. |
| [`domain/ports/in/update_status_use_case.dart`](file:///d:/Projet%20flutter/candidature/lib/features/candidature/domain/ports/in/update_status_use_case.dart) | **Port d'Entrée** | Interface de cas d'usage pour modifier le statut d'un candidat. |
| [`domain/ports/out/candidature_repository_port.dart`](file:///d:/Projet%20flutter/candidature/lib/features/candidature/domain/ports/out/candidature_repository_port.dart) | **Port de Sortie** | Interface décrivant les opérations de persistance de données exigées par le métier. |
| [`domain/services/candidature_use_cases_impl.dart`](file:///d:/Projet%20flutter/candidature/lib/features/candidature/domain/services/candidature_use_cases_impl.dart) | **Service Domaine** | Implémentations des cas d'usage incluant les règles de validation strictes. |
| [`adapters/out/supabase_candidature_repository_adapter.dart`](file:///d:/Projet%20flutter/candidature/lib/features/candidature/adapters/out/supabase_candidature_repository_adapter.dart) | **Couche Infrastructure** | Implémentation concrète du port de sortie via le SDK Supabase Flutter. |
| [`adapters/in/candidature_notifier.dart`](file:///d:/Projet%20flutter/candidature/lib/features/candidature/adapters/in/candidature_notifier.dart) | **Couche Présentation** | Riverpod Notifier effectuant l'injection et la conversion des fichiers UI vers le Domaine. |

---

## 🔒 5. Sécurité et Conformité Intégrées

1.  **RGPD (GDPR Evidence)** : Le système insère de manière obligatoire un enregistrement au sein de la table `consent_records` pour chaque candidature soumise avec la version des conditions générales acceptées.
2.  **Historique d'Audit PostgreSQL** : Un trigger PostgreSQL autonome journalise automatiquement chaque modification de statut de candidature dans la table d'audit, empêchant ainsi toute falsification ou suppression de trace.
3.  **URLs de Médias Signées** : Les fichiers ne sont jamais exposés publiquement. Les recruteurs autorisés reçoivent une URL d'accès valide pendant **60 minutes seulement**.
