# Vue d'ensemble — Vague "Modules opérationnels école"

## Contexte

Deux vagues précédentes sont terminées (voir `00-OVERVIEW.md` pour le détail
complet, **toujours valable, ne pas le relire en entier si vous connaissez
déjà le projet** — contexte, conventions de code, règles git/pnpm/build) :

- **Phase 1 (MVP)** : auth JWT/RBAC, école/classes/matières, élèves,
  enseignants, présences élèves, notes/bulletins.
- **Phase "SaaS multi-tenant"** (`01` à `08`) : rôle SUPER_ADMIN, plans/
  licences, provisioning d'écoles (manuel + self-service), abonnements et
  paiements manuels (espèces/mobile money), parent multi-écoles.

Cette nouvelle vague finalise les modules **opérationnels** d'une école
qui restaient absents ou partiels du cahier des charges d'origine :
Administratif (salles/emploi du temps), Élèves (compléments), Enseignants/
Staff, Académique, Communication, Finance (frais de scolarité — **distinct**
de la facturation SaaS plateforme déjà construite), et Rapports.

## Ce qui NE change PAS (ne pas relire si déjà connu)
Toutes les règles communes de `00-OVERVIEW.md` s'appliquent telles quelles :
branche unique, `pnpm` partout, PostgreSQL natif (`service postgresql start`
si besoin), convention ESM (imports `.js`), pattern module NestJS (`*.module.ts`
+ `*.controller.ts` + `*.service.ts` + `dto/`), `@Roles`/`RolesGuard`/`@Public`
déjà globaux, build obligatoire avant commit, un commit par sous-projet.

## Graphe de dépendances

```
10 Schéma complet (toutes les nouvelles tables)
      │
      ├────────────┬────────────┬────────────┬────────────┬────────────┐
      ▼            ▼            ▼            ▼            ▼            ▼
11 Admin       12 Élèves    13 Staff     14 Académique 15 Communic. 16 Finance
(salles/       (photo,      (présence,                (messages,   (frais,
 emploi du      carte,       contrats,                 annonces,    factures,
 temps)         diplôme)     évaluations)              réunions)    dépenses)
      │            │            │            │            │            │
      └────────────┴────────────┴────────────┴────────────┴────────────┘
                                 │
                                 ▼
                          17 Rapports (exports)
                                 │
                                 ▼
                    18 Frontend (tous les modules ci-dessus)
                                 │
                                 ▼
                      19 Vérification end-to-end + README
```

**11 à 16 sont indépendants entre eux une fois 10 posé** — ils touchent des
fichiers disjoints (chacun son propre dossier `src/<module>/`), donc
peuvent être confiés à des sous-agents en parallèle, **à condition qu'un
seul agent à la fois touche `app.module.ts`** (câblage du nouveau module) :
sérialiser uniquement cette étape finale de chaque sous-projet (lire l'état
réel du fichier avant d'y ajouter sa ligne, pas de edit simultané).
17 a besoin que 13 (staff), 14, 16 existent pour avoir des données à
exporter. 18 a besoin de 11-17. 19 est toujours en dernier.

## Modèle recommandé par sous-projet (économie de tokens)

| Sous-projet | Complexité | Modèle |
|---|---|---|
| 10 — Schéma complet | Fondation, bloque tout, risque élevé si erreur | **sonnet, effort élevé** (relire deux fois avant migration) |
| 11 — Admin (salles/emploi du temps) | Détection de conflits (créneaux qui se chevauchent) | sonnet |
| 12 — Élèves (compléments) | Upload fichier + génération PDF simple | sonnet |
| 13 — Staff (présence/contrats/évaluations) | CRUD répétitif, pattern déjà vu 3x dans le projet | sonnet |
| 14 — Académique (curriculum/devoirs) | CRUD + soumissions, pattern déjà vu | sonnet |
| 15 — Communication (messages/annonces/réunions) | Logique de ciblage d'audience, un peu plus fine | sonnet |
| 16 — Finance (frais/factures/paiements) | **Argent réel, calculs de soldes** — à vérifier avec le plus de soin | **sonnet, effort élevé** (même niveau de rigueur que le schéma) |
| 17 — Rapports (exports) | Agrégations + génération PDF/CSV | sonnet |
| 18 — Frontend | Volume élevé mais répétitif (mêmes patterns React déjà établis) | sonnet |
| 19 — E2E + README | Vérification, pas de nouvelle logique | sonnet, voire un modèle plus léger si disponible (tâche de vérification, pas de conception) |

**Principe appliqué** : aucun sous-projet ne justifie un modèle plus cher
que sonnet — tout est du CRUD/pattern déjà établi dans ce repo, pas de
recherche ouverte. Les deux seuls marqués "effort élevé" (10 et 16) le sont
parce qu'une erreur y coûte cher en aval (migration = fondation pour tout;
finance = argent réel), pas parce qu'ils demandent un modèle différent.
Ne pas descendre à un modèle plus faible que sonnet pour du code : le
risque de bugs silencieux (ex. le bug cross-école découvert au sous-projet
02) coûte plus cher en reprise que l'économie initiale.

## Hors scope (ne pas construire sauf demande explicite)
- Paie réelle (calcul de charges sociales, bulletins de salaire) : le
  sous-projet 13 se limite à **enregistrer les termes du contrat**
  (salaire, type, dates), pas à calculer une paie.
- Export Excel natif (`.xlsx`) : le sous-projet 17 fait du CSV (aucune
  dépendance) et un seul PDF de démonstration (bulletin). Si l'export
  Excel est requis plus tard, c'est un ajout ciblé, pas une réouverture
  de ce sous-projet.
- Pièces jointes de fichiers réels (devoirs, messages) : stockage en
  base de données ou comme simple URL/texte en v1 (pas d'intégration
  S3/Cloudinary — cohérent avec la décision déjà prise pour les photos
  de profil).
- Notifications push/email/SMS pour messages et annonces : in-app
  uniquement (lecture au prochain login), pas d'envoi réel.
