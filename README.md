# 🎤 Voice Talents - Plateforme de Candidatures & Évaluations (V2 Enterprise)

Cette plateforme moderne de gestion de candidatures intègre un formulaire de soumission candidat en 4 étapes et un tableau de bord d'évaluation avec de solides exigences de sécurité (RLS stricte, buckets privés, logs d'audit et historique des décisions).

---

## 🛠️ Stack Technique
*   **Frontend** : Flutter Web & Mobile (Riverpod, GoRouter, PDF/CSV Engines)
*   **Backend** : Supabase (Auth Anonyme & Email, Storage privé)
*   **Base de données** : PostgreSQL (Triggers de logs, RLS par rôle)

---

## 🚀 Installation Rapide

### 1. Configuration Cloud (Supabase)
1. Créez un nouveau projet sur [Supabase](https://supabase.com/).
2. Allez dans l'**Éditeur SQL** de Supabase et copiez-y le contenu du fichier [supabase_v2_setup.sql](supabase_v2_setup.sql). Exécutez le script.
   *   *Ce script crée les tables d'audit, de consentements, l'historique de statut, le bucket privé de stockage et configure les politiques RLS.*
3. Activez l'**Authentification Anonyme** dans `Authentication > Providers > Anonymous`.
4. Créez un utilisateur administrateur dans `Authentication > Users` (Email/Mot de passe), puis insérez son profil dans la table `user_profiles` avec le rôle `admin` ou `recruteur` :
   ```sql
   INSERT INTO public.user_profiles (id, email, role) 
   VALUES ('USER_UUID_DE_SUPABASE', 'votre_email@admin.com', 'admin');
   ```

### 2. Configuration Environnementale (`.env`)
Créez un fichier `.env` à la racine du projet et ajoutez vos clés d'API Supabase :
```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre-cle-api-anonyme
```

### 3. Exécution de l'Application
Installez les dépendances et lancez l'application :
```bash
flutter pub get
flutter run -d chrome
```

---

## 🔒 Plan de Sécurité & RLS
*   **Moindre Privilège** : Les candidats n'ont accès qu'à leur propre ligne de candidature via l'attribut `auth.uid() = user_id`.
*   **Buckets Sécurisés** : Les fichiers médias (photos/vidéos) sont stockés dans un bucket privé.
*   **URLs Signées Temporaires** : L'accès aux pièces jointes s'effectue via des liens sécurisés valables 1 heure, générés dynamiquement par le recruteur connecté.
*   **Journalisation inaltérable** : Les modifications de statut et actions d'administration génèrent automatiquement des entrées dans la table `audit_logs` via des triggers PostgreSQL.
