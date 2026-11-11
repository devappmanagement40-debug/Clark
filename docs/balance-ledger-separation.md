# Séparation des soldes : préparation

**État :** préparation uniquement. Ce document ne modifie ni le code actif, ni le schéma Supabase, ni les soldes des comptes.

## Règle métier confirmée

La plateforme doit avoir deux soldes distincts :

- **Solde des dépôts (`deposit_balance`)** : reçoit les dépôts approuvés et le bonus d’inscription. Il n’est pas retirable et reste réservé aux achats.
- **Solde des revenus (`earnings_balance`)** : reçoit les revenus journaliers et les autres crédits qui ne sont pas des dépôts ou le bonus d’inscription. C’est le seul solde retirable.

Les crédits hors dépôts comprennent les commissions, récompenses de tâches, cadeaux, pointages, réclamations de produits gratuits, déblocages de staking et remboursements de retraits.

La règle existante de dépense des produits est conservée pour la préparation : les achats de produits et de staking consomment d’abord le solde des dépôts, puis le solde des revenus si nécessaire. Les retraits diminuent uniquement le solde des revenus; un retrait rejeté y est recrédité.

## État actuel constaté

- La table `users` ne possède qu’un champ financier stocké : `balance`.
- `today_earnings` et `total_earnings` sont des compteurs, pas des soldes. Le traitement quotidien les incrémente avec les revenus journaliers; le bonus d’inscription n’incrémente pas `total_earnings`.
- Les dépôts, le bonus d’inscription et les autres crédits modifient tous `balance`.
- Le montant retirable est calculé en soustrayant de `balance` le principal des dépôts approuvés qui n’a pas été consommé par des achats.
- Un retrait débite `balance`; son rejet recrédite `balance`.

Le calcul actuel protège le principal des dépôts dans le contrôle des retraits, mais ne fournit pas deux soldes persistés et affichables séparément.

## Schéma cible proposé

Ajouter à `users` deux colonnes décimales compatibles avec les montants XOF/XAF :

```sql
deposit_balance  numeric(15,2)
earnings_balance numeric(15,2)
```

Pendant la transition, `balance` reste inchangé et sert de total historique. Après rapprochement validé, il devra être maintenu comme total dérivé (`deposit_balance + earnings_balance`) ou retiré des lectures financières; il ne devra jamais devenir une troisième source de vérité.

Le compteur `total_earnings` reste distinct du portefeuille retirable. Le bonus d’inscription est crédité au solde des dépôts et n’incrémente pas le compteur « Revenus cumulés ».

## Rapprochement des comptes existants

Ne pas remplir les nouvelles colonnes tant que le rapport de rapprochement n’a pas été examiné et validé.

Pour chaque compte, calculer une proposition sans écriture :

1. Total des dépôts approuvés, en excluant les dépôts liés au prépaiement de frais de retrait.
2. Total des achats de produits et de staking débités, selon la règle existante qui consomme les dépôts en premier.
3. `deposit_balance` proposé = maximum de zéro et (dépôts approuvés − achats/staking imputés aux dépôts).
4. `earnings_balance` proposé = solde historique `balance` − `deposit_balance` proposé.
5. Vérifier que les deux montants sont non négatifs et que leur somme égale exactement le solde historique.

Tout compte qui ne satisfait pas ces contrôles — notamment à cause d’un ajustement manuel, d’un historique incomplet ou d’une valeur négative — doit être signalé pour examen individuel, et non corrigé automatiquement. Aucun transfert ne doit être appliqué sur la base d’une estimation globale.

## Déploiement à faire après validation

1. Examiner le rapport en lecture seule et approuver explicitement les écarts et la méthode de rapprochement.
2. Appliquer une migration additive ciblée pour créer les deux colonnes; ne pas exécuter un `db:push` général sur Supabase sans revue de son SQL.
3. Initialiser les comptes à partir des montants rapprochés, en conservant une trace et un total de contrôle par compte.
4. Modifier les écritures serveur : dépôts vers `deposit_balance`; tous les crédits hors dépôts vers `earnings_balance`; achats selon l’ordre établi; retraits et remboursements de retrait uniquement sur `earnings_balance`.
5. Mettre à jour les affichages et toutes les validations serveur afin qu’aucune route ne puisse retirer le solde des dépôts.
6. Tester dépôts approuvés/refusés, bonus d’inscription, revenus journaliers, commissions, récompenses, achats, staking, retrait accepté/rejeté, et répétition des callbacks.
7. Comparer `balance` historique et somme des deux soldes avant de basculer les lectures de l’application.

## Résultat du rapprochement en lecture seule

Instantané du 12 octobre 2026, calculé depuis la base Supabase configurée. Les requêtes ont été exécutées dans une transaction PostgreSQL `READ ONLY`, puis annulées; aucune valeur n’a été écrite.

| Devise | Comptes | Solde actuel total | Dépôts approuvés hors frais | Achats/staking débités | Dépôt proposé | Revenus proposés |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| XOF | 2 | 2 048,00 | 0,00 | 0,00 | 0,00 | 2 048,00 |

- La table des dépôts ne contient aucune ligne dans cet instantané.
- L’historique contient 3 crédits de type `bonus`, pour un total de 2 048,00 XOF; aucun autre type de transaction n’est présent.
- Pour les 2 comptes, le solde actuel correspond exactement au total net des transactions enregistrées; aucun écart de registre ni solde proposé négatif n’a été détecté.
- Aucun nom, téléphone ni identifiant de compte n’a été exporté dans ce rapport.

Ce rapprochement décrit uniquement l’état observé le 12 octobre 2026. Il ne valide pas une migration future et n’autorise aucun transfert automatique. Aucune migration ni écriture de rapprochement n’a été exécutée.
