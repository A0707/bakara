# Bakara

Application de gestion des finances familiales et du patrimoine immobilier : caisse, charges, entrées, loyers, locataires et biens. L’interface est responsive et l’application reste installable en PWA.

## Démarrer

Node.js 22.12+ recommandé.

```sh
npm ci
npm run dev
```

La configuration publique du projet Supabase existant est conservée dans `src/lib/config.js`. Vous pouvez la remplacer avec les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env.local` (voir `.env.example`). Utiliser exclusivement une clé publique/anon ; jamais de clé `service_role` dans le frontend.

Le mode local est limité au serveur de développement : un build de préproduction ou production se connecte à Supabase même si `VITE_LOCAL_MODE=true` est défini par erreur. Les paramètres par défaut ciblent le projet Bakara `vpzsrmwthtllmwmsgfsn`. Une collection absente de la réponse est signalée comme indisponible, et ne sert pas à calculer un faux solde à zéro ou déficitaire.

Pour développer sans connexion à Supabase, définir `VITE_LOCAL_MODE=true` dans `.env.local`. Ce mode utilise les clés historiques `bakara_charges`, `bakara_alim`, `bakara_biens` et `bakara_locataires` de ce navigateur. Les données initiales de l’ancienne application restent disponibles en mode local lorsque ces clés n’existent pas. Ne pas activer ce mode dans un déploiement partagé.

## Architecture

- `src/pages/` : tableau de bord, connexion et quatre modules de gestion.
- `src/components/` : navigation, champs, formulaires, boutons, badges, dialogues natifs et icônes SVG.
- `src/hooks/` : session/profil et chargement/sauvegarde des collections.
- `src/lib/` : règles métier pures, repository injectable, migrations et calculs financiers.
- `src/app.css` : styles et tokens de l’interface, communs à tous les écrans.
- `public/` : manifeste, icônes et service worker.
- `tests/` : migrations, calculs et scénarios navigateur.

React est compilé avec Vite : aucune compilation Babel ni dépendance JavaScript CDN au chargement. Les données Supabase conservent les tables `bakara_data` et `profiles` ainsi que les identifiants de collections existants. Les clés de paiements restent `année-mois` avec un mois de 0 à 11. Aucun changement de schéma n’est nécessaire.

Le solde de caisse reste `entrées − charges`. Les loyers sont suivis séparément comme dans l’application précédente, afin d’éviter de compter deux fois les encaissements déjà enregistrés dans les entrées. Les nouveaux paiements gardent leur montant au moment de l’enregistrement pour préserver l’historique après une hausse de loyer ; les anciens paiements sans montant gardent le comportement historique.

Les utilisateurs `admin` et `family` peuvent modifier ; les autres profils et les profils non chargés sont en lecture seule. Ces contrôles d’interface complètent les politiques RLS existantes : la base reste responsable des autorisations. Cette refonte ne modifie pas les politiques du projet distant.

Une erreur de lecture ne remplace jamais les données distantes par des données initiales. Les montants historiques initiaux sont conservés uniquement pour le développement local et exclus des fichiers du build partagé. Les pages sont chargées à la demande et précachées pour la PWA.

Le repository charge les quatre collections dans une requête. Les règles métier génèrent les modifications sans changer les tableaux d’origine. Les associations et suppressions bien/locataire envoient les deux collections dans un seul upsert, exécuté dans une transaction de la Data API. L’interface adopte les modifications uniquement après confirmation. Pendant l’écriture, une seconde opération est empêchée. En cas d’échec, les données restent inchangées et le formulaire permet de réessayer. En mode local, une erreur d’écriture déclenche la restauration des anciennes valeurs.

La structure historique stocke toujours une collection entière par ligne. Deux appareils peuvent donc se remplacer mutuellement des modifications concurrentes : la nouvelle transaction protège les liens d’une opération, mais n’ajoute pas de résolution des conflits entre clients. Une migration vers des lignes par bien, locataire et paiement reste une évolution du backend, non exécutée ici.

L’analyse et les décisions de refonte sont détaillées dans [docs/DESIGN_ARCHITECTURE.md](docs/DESIGN_ARCHITECTURE.md).

La structure produit complète, le portail locataire et les fonctionnalités à développer sont proposés dans [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md). Une page déjà ouverte doit être rechargée pour récupérer les mises à jour effectuées directement dans le backend. La documentation publique se limite aux aspects techniques et ne détaille pas les montants ou les dossiers de production.

## Vérifier

```sh
npm test
npm run build
npm run format:check
npm audit
npx playwright install chromium
npm run test:browser
```

Tests navigateur en mode local :

```sh
npx playwright install chromium
# Terminal 1 : VITE_LOCAL_MODE=true dans .env.local
npm run dev
# Terminal 2
npm run test:ui
```

Les tests de connexion simulée demandent une seconde instance sans `VITE_LOCAL_MODE` : `npm run dev -- --port 5174`, puis `npm run test:auth`. Toutes ses requêtes vers Supabase sont interceptées ; aucune donnée distante n’est modifiée. `PLAYWRIGHT_EXECUTABLE_PATH` permet de réutiliser un Chromium installé. Les captures sont générées dans `test-results/`.

Après compilation, `npm run preview` puis `npm run test:pwa` vérifient les assets de production et le chargement hors connexion de la page de connexion.

`npm run test:browser` démarre et ferme automatiquement des instances de test locales sur les ports 5283, 5284 et 4283. Il couvre les opérations, la connexion simulée, le cache PWA et les contrôles axe sur les cinq écrans. Les tests sont également exécutés dans GitHub Actions. Aucun test ne se connecte à un compte réel ni n’écrit dans la base distante.

## Installation mobile

Le bouton « Installer Bakara » est disponible sur la connexion et dans l’espace familial. Sur les navigateurs compatibles, il ouvre la demande d’installation. Sinon, une aide explique comment ajouter Bakara à l’écran d’accueil : menu d’installation de Chrome sur Android, ou menu de partage puis « Sur l’écran d’accueil » dans Safari sur iPhone. Le bouton disparaît une fois l’installation détectée ou lorsque l’application est ouverte en mode autonome.

La PWA doit être servie en HTTPS (ou localhost en développement). Le build génère un service worker avec les fichiers JavaScript et CSS compilés et un cache versionné par build. Après une première ouverture en ligne et l’installation du service worker, l’interface peut s’ouvrir hors connexion sans rechargement préalable. Les données financières et les API Supabase ne sont pas mises en cache. Un message signale l’absence de réseau ; la connexion et les modifications distantes sont bloquées tant que le téléphone est hors connexion. Il ne s’agit pas d’une synchronisation de données hors ligne.

## Déploiement

Vercel exécute `npm run build` et publie `dist/`. Les fichiers statiques restent exclus de la réécriture SPA. Le service worker ne met en cache que les fichiers de l’application et les assets du même domaine ; les API et sessions ne sont jamais mises en cache. Une mise à jour attend la fermeture des anciens onglets pour éviter d’interrompre une saisie. La disponibilité hors connexion de l’interface ne garantit pas une session Supabase ni l’accès aux données financières.

Exporter les données depuis l’interface avant une mise en production et vérifier une connexion avec un compte réel sur l’aperçu. Les tests simulés valident le comportement client, mais pas les politiques RLS ou la disponibilité du projet Supabase réel.
