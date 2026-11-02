# Sous-projet 08 — Vérification end-to-end + mise à jour README

## Dépend de
Tous les sous-projets précédents (01 à 07). **Dernier maillon.**

## Contexte
Avant de considérer cette phase terminée, il faut une preuve réelle
(navigateur, pas juste "ça compile") que le parcours complet fonctionne,
et une documentation à jour reflétant la nouvelle architecture.

## Fichier de référence
`README.md` (racine du repo) — structure existante à conserver (tableau
stack technique, démarrage rapide, comptes de démo, fonctionnalités
livrées, roadmap, sécurité). Mettre à jour les sections concernées sans
tout réécrire.

## Partie A — Vérification end-to-end en navigateur réel

Utiliser Playwright + Chromium pré-installé (voir
`/opt/pw-browsers/chromium`, invoqué via un script `.cjs` avec
`NODE_PATH=/opt/node22/lib/node_modules node script.cjs` si `playwright`
n'est pas dans les dépendances locales — pattern déjà utilisé dans cette
session, fonctionnel).

Démarrer avant de tester :
1. PostgreSQL (`service postgresql start` si `down`)
2. Backend : `cd backend && pnpm exec nest build && node dist/main.js`
   (ou `pnpm start:dev`), vérifier qu'il boot sans erreur et que toutes
   les routes `platform/*` sont bien mappées dans les logs de démarrage.
3. Frontend : `cd frontend && pnpm dev`

Scénarios à exécuter et capturer en screenshot (sauvegarder dans le
répertoire scratchpad de la session, pas dans le repo) :

1. **Inscription self-service** → aller sur `/signup`, remplir le
   formulaire avec un plan existant, soumettre → message de succès.
2. **Connexion super-admin** (`super.admin@platform.app` /
   `Password123!` si le seed du sous-projet 06 a tourné) → dashboard
   plateforme affiche les bons compteurs.
3. **Approbation** de l'école créée à l'étape 1 → vérifier qu'elle passe
   à `ACTIVE` avec un abonnement.
4. **Enregistrement d'un paiement** sur une des écoles → vérifier que le
   statut d'abonnement et l'échéance se mettent à jour, et que
   l'historique des paiements affiche la nouvelle ligne.
5. **Création manuelle d'une école** par le super-admin → école
   immédiatement active.
6. **Connexion en tant que `parent1@ecole.fr`** → le dashboard parent
   affiche bien des enfants dans **les deux écoles** du seed (sélecteur
   d'enfant si plusieurs) — c'est le test de non-régression le plus
   important de toute cette phase.
7. Vérifier l'absence d'erreur dans la console du navigateur sur chacun
   des écrans ci-dessus (`page.on('console', ...)` /
   `page.on('pageerror', ...)` comme déjà pratiqué dans cette session).
8. Arrêter proprement les serveurs de test à la fin (`pkill -f "node dist/main.js"`,
   `pkill -f vite`) avant de rendre la main.

Si un scénario échoue à cause d'un bug dans un sous-projet antérieur déjà
commité : corriger le bug directement (c'est le rôle de cette dernière
étape de rattraper ce genre de problème), committer la correction
séparément avec un message clair expliquant quel sous-projet antérieur
est concerné.

## Partie B — Mise à jour du README

- **Stack technique** : mentionner `@nestjs/throttler` si ajouté.
- **Nouvelle section "Architecture multi-tenant"** : expliquer en
  quelques phrases le modèle (shared database/shared schema, `schoolId`
  comme discriminant, `SUPER_ADMIN` hors école, parent pouvant appartenir
  à plusieurs écoles).
- **Tableau des rôles** : ajouter `SUPER_ADMIN`.
- **Comptes de démonstration** : ajouter le compte super-admin et
  mentionner les 3 écoles du seed (active/en essai/en attente) et le
  parent multi-écoles.
- **Fonctionnalités livrées** : ajouter une sous-section "Plateforme
  SaaS (Phase 1.5)" listant : provisioning manuel + self-service, plans/
  licences, abonnements, paiements manuels (espèces/mobile money),
  support des parents multi-écoles.
- **Roadmap** : retirer de la liste "Phase 2/3" ce qui vient d'être livré
  ici si c'était déjà mentionné en ébauche ; ajouter en "hors scope noté
  pour plus tard" les points du fichier `docs/delegation/00-OVERVIEW.md`
  (application des quotas de plan, expiration automatique des essais,
  sous-domaines par école, durcissement Prisma de l'isolation).
- **Sécurité** : ajouter une ligne sur le rate-limiting de l'inscription
  publique.

## Fichiers à modifier
- `README.md`
- Potentiellement tout fichier backend/frontend si un bug de
  non-régression est découvert et corrigé pendant les tests (voir Partie
  A, dernier paragraphe).

## Ne pas toucher
- Ne pas supprimer ou réécrire les sections du README qui ne sont pas
  concernées par cette phase (démarrage rapide Docker, sécurité générale
  déjà en place, etc.).

## Critères d'acceptation
- Les 6 scénarios de la Partie A passent sans erreur console.
- README à jour, relu une fois pour cohérence globale.
- Commit final + push.
- Mettre à jour la todo-list de suivi de session (tâches #11 à #19) en
  `completed`.
