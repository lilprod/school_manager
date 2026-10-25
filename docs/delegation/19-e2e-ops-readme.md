# Sous-projet 19 — Vérification end-to-end + mise à jour README

## Dépend de
Tous les sous-projets de cette vague (10 à 18). **Dernier maillon.**

## Modèle recommandé : sonnet (tâche de vérification, pas de conception)

## Partie A — Vérification end-to-end en navigateur réel
Même protocole que le sous-projet 08 de la vague précédente (Playwright
+ Chromium pré-installé, voir cette session pour le script type si
besoin de le retrouver). Scénarios minimum, un par module :

1. **Administratif** : créer une salle, créer deux créneaux d'emploi du
   temps qui se chevauchent pour le même professeur → le second est
   refusé.
2. **Élèves** : uploader une photo, télécharger la carte d'élève (PDF),
   diplômer un élève → il disparaît des listes actives.
3. **Staff** : marquer une présence enseignant, créer un contrat, créer
   une évaluation.
4. **Académique** : créer un devoir, le soumettre en tant qu'élève, le
   corriger en tant qu'enseignant, vérifier que la note apparaît côté
   élève.
5. **Communication** : envoyer un message entre deux rôles de la même
   école, publier une annonce ciblée, demander puis confirmer une
   réunion parent-prof.
6. **Finance** : facturer une classe entière, enregistrer un paiement
   partiel puis complet sur une facture, vérifier le changement de
   statut à chaque étape.
7. **Rapports** : télécharger chaque export CSV et le PDF de bulletin,
   vérifier `GET /reports/summary`.

Vérifier l'absence d'erreur console sur chaque écran. Nettoyer toutes
les données de test créées pendant la vérification (même discipline que
les vagues précédentes : super-admin/comptes temporaires non committés,
supprimés après usage).

## Partie B — Mise à jour du README
- **Fonctionnalités livrées** : ajouter une sous-section "Modules
  opérationnels" listant Administratif, Élèves (compléments), Staff,
  Académique, Communication, Finance, Rapports — au même niveau de
  détail que les sections existantes.
- **Roadmap** : retirer ces modules de la liste des manques (section
  "Ce qui n'est pas fait" si elle existe encore sous cette forme) ;
  ne garder dans le "hors scope" que ce qui est listé dans
  `09-OVERVIEW-OPS.md` (paie réelle, Excel natif, pièces jointes
  fichiers réelles, notifications push/email/SMS).
- **Stack technique** : ajouter `pdfkit`/`multer` si absents du tableau.
- **Sécurité** : mentionner la validation de type/taille sur l'upload
  de photo, et le contrôle d'accès cross-école de la messagerie.

## Fichiers à modifier
- `README.md`
- Tout fichier backend/frontend si un bug de non-régression est
  découvert pendant les tests (même règle que le sous-projet 08 : le
  corriger ici plutôt que le signaler sans agir).

## Critères d'acceptation
- Les 7 scénarios de la Partie A passent sans erreur console.
- README à jour et cohérent avec l'état réel du code.
- Commit final + push.
- Mettre à jour la todo-list de session (tâches de cette vague) en
  `completed`.
