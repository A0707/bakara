# Bakara — structure produit et directives UI/UX

## Contexte et données de production

L’application associe finances familiales, patrimoine et suivi des loyers. La capture montre une liste de sources de financement avec un total, mais peu de contexte sur la période, les paiements ou les relations aux biens.

L’application charge les collections financières et immobilières depuis Supabase. La documentation publique décrit les règles d’affichage et la structure technique, sans détailler les montants ou le contenu des dossiers de production. Le navigateur doit recharger les données après une mise à jour effectuée directement dans le backend.

Le build partagé se connecte au backend Supabase. Le mode local et ses données initiales sont réservés au serveur de développement. Une collection absente se distingue d’une collection existante vide : un solde non calculable est affiché comme indisponible et ne devient ni zéro ni un déficit artificiel.

## 1. Fonctionnalités et priorités

### Propriétaire et gestionnaire

| Priorité | Fonction               | Comportement attendu                                                                                                                    |
| -------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Patrimoine             | Fiche par bien : occupation, bail actif, locataire, surface, loyer et historique                                                        |
| P0       | Baux                   | Dates de début/fin, loyer, jour d’échéance, dépôt et document associé                                                                   |
| P0       | Échéances et paiements | Montant appelé, montant reçu, reste à payer ; support des paiements partiels et de plusieurs mois                                       |
| P0       | Tableau de bord        | Période explicite, encaissements, échéances, retards et occupation ; caisse séparée du suivi locatif                                    |
| P0       | Données fiables        | Entrées réelles, rapprochement des paiements, erreurs visibles, droits et historique des modifications                                  |
| P1       | Documents              | Génération d’un document adapté au paiement confirmé ; quittance de période réglée et reçu pour paiement partiel selon le modèle retenu |
| P1       | Alertes                | Relances ciblées après la date d’échéance, notifications de fin de bail et suivi des demandes                                           |
| P1       | Export                 | PDF de document et export des données filtrées ; archivage plutôt que suppression d’un dossier ayant un historique                      |

Le socle caisse/charges/entrées/biens/locataires/paiements existe déjà. Les baux structurés, échéances, paiements partiels, quittances et relances constituent la prochaine évolution, et ne sont pas annoncés comme déjà développés.

### Locataire

- Portail distinct : loyer attendu, échéance, reste à payer et statut de paiement.
- Historique personnel et documents téléchargeables pour son bail uniquement.
- Dépôt d’une preuve de paiement, puis validation ou rapprochement par le gestionnaire.
- Tickets d’incident avec catégorie, description, photos, statut et échanges.
- Paiement hébergé chez un prestataire en P2, avec confirmation serveur et gestion des statuts en attente, réussi ou échoué.

Un locataire ne doit pas être traité comme un simple invité de l’espace familial : l’autorisation sur ses baux et documents doit être appliquée dans la base.

## 2. Architecture de navigation et données

```text
Accueil
Patrimoine
  Biens · Locataires · Baux
Loyers
  Échéances · Paiements · Retards · Quittances
Finances
  Caisse · Entrées · Charges
Demandes
  Incidents · Messages
Documents
Paramètres
  Compte · Membres et droits · Modèles · Notifications
```

Navigation mobile gestionnaire : Accueil, Biens, Loyers, Demandes, Plus. Navigation locataire : Accueil, Paiements, Documents, Demandes, Compte. Chaque espace montre uniquement les fonctions autorisées.

### Structure des dossiers et modèle cible

- **Organisation / membre** : espace familial, utilisateur et rôle.
- **Bien** : identité du logement/local, adresse, surface et informations du patrimoine.
- **Locataire** : identité, coordonnées et éventuel compte de portail.
- **Bail** : relation bien–locataire, dates, montant du loyer et jour d’échéance.
- **Échéance** : bail, période, date limite et montant attendu.
- **Paiement / allocation** : montant réel reçu et répartition entre une ou plusieurs échéances.
- **Mouvement de caisse** : entrée ou dépense avec éventuel lien vers un paiement ; pas de double comptage.
- **Document / incident** : fichiers privés et demandes rattachés au bien ou au bail.
- **Historique de modification** : acteur, action, objet et date pour les changements financiers.

Le modèle cible utilise des relations et des contraintes uniques, notamment une échéance par bail et période. La migration depuis les collections JSON doit conserver les identifiants, paiements et périodes historiques. Elle sera validée séparément avant exécution ; aucune migration distante n’est exécutée dans cette proposition.

### Organisation des informations

La liste d’un bien présente son nom, l’occupation, le loyer et la prochaine action. La fiche détaillée utilise des onglets Aperçu, Bail, Paiements, Documents et Incidents. Recherche, période et filtres de statut précèdent la liste. Les coordonnées complètes, notes et justificatifs restent dans la fiche. Une alerte d’impayé suppose une échéance connue, dépassée et un reste à payer supérieur à zéro ; l’absence d’un paiement dans un mois sans bail daté ne suffit pas à déclarer un impayé.

## 3. Design et ergonomie

### Tableau de bord ordinateur

Grille de 12 colonnes avec un menu latéral stable. En-tête : titre, filtre de période, sélection du périmètre et bouton Enregistrer un paiement. Première rangée : quatre indicateurs — attendu, encaissé, reste à recevoir et occupation — avec unité, période et libellé. Zone centrale sur 8 colonnes : suivi des encaissements/échéances et dernières opérations. Panneau de 4 colonnes : échéances en retard, baux proches de leur terme et demandes à traiter, classés par prochaine action. La caisse possède un bloc distinct indiquant sa règle de calcul et l’éventuelle absence de sources.

Chaque ligne en retard montre le locataire, le bien, l’échéance, le reste à payer et l’action Contacter ou Enregistrer. Aucun graphique ne présente une tendance sans données datées permettant de la calculer.

### Palette et tokens

| Token              | Valeur     | Usage                                    |
| ------------------ | ---------- | ---------------------------------------- |
| `color-primary`    | `#4355D4`  | Navigation active et actions principales |
| `color-text`       | `#202944`  | Titres et texte principal                |
| `color-background` | `#F7F8FC`  | Fond général                             |
| `color-surface`    | `#FFFFFF`  | Cartes et formulaires                    |
| `color-success`    | `#1F7458`  | Paiement confirmé                        |
| `color-warning`    | `#855613`  | Échéance à surveiller                    |
| `color-danger`     | `#A43859`  | Retard confirmé ou erreur                |
| `color-patrimony`  | `#7557B4`  | Patrimoine et documents                  |
| `spacing-unit`     | `8 px`     | Échelle 8, 16, 24 et 32 px               |
| `radius-card`      | `16–18 px` | Cartes et panneaux                       |

Typographie sans sérif : corps 14–16 px, titres 24–32 px, petits libellés 12 px. Montants avec chiffres tabulaires, deux décimales et unité MAD. Couleurs d’accent accompagnées d’un texte de statut, jamais utilisées seules. Bordures discrètes et ombres légères ; une seule action principale par zone.

### Mobile, formulaires et états

- Sous 768 px : une colonne, cartes pour les listes, navigation inférieure et zones tactiles d’au moins 44 px.
- De 768 à 1023 px : deux colonnes pour les indicateurs et filtres qui se replient.
- À partir de 1024 px : grille complète et navigation latérale ; les écrans actuels peuvent conserver leurs seuils techniques tant que les tests valident le résultat.
- Un formulaire court pour l’action courante ; champs supplémentaires dans une section secondaire.
- Afficher les erreurs près de la saisie et garder le formulaire ouvert après un échec.
- Pendant une sauvegarde : bouton occupé et seconde soumission empêchée. Après succès : message de confirmation et actualisation du seul dossier concerné.
- Différencier Aucune donnée, Aucun résultat de recherche, Source indisponible et Connexion perdue.
- Hors connexion : interface PWA accessible, fonctions distantes désactivées et message explicite.
- Clavier : ordre logique, focus visible, fermeture des dialogues avec Échap et retour du focus à l’action initiale.

## Ordre de développement

1. Valider l’interface avec les collections réelles et les comptes existants.
2. Structurer les baux et échéances ; gérer paiements partiels, allocations et archivage.
3. Ajouter quittances, relances, documents et portail locataire avec droits adaptés.
4. Ajouter paiement en ligne, messagerie et automatisations après validation des règles de rapprochement.

Critères d’acceptation : pas de donnée d’exemple dans un build partagé ; pas de solde calculé avec une source absente ; pas de doublon d’échéance ou d’encaissement ; un locataire voit uniquement son dossier ; refus d’une sauvegarde sans changement des données affichées ; parcours essentiels testés sur mobile et ordinateur.
