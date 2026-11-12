---
name: Attribution des tours de roue
description: Règle des tours gagnés lors d’un achat de produit et d’un achat parrainé.
---

Chaque achat payant confirmé crédite un tour à l’acheteur et un tour à son parrain direct. Seuls les achats effectués après la mise en place de cette règle sont concernés. Le tirage exige une configuration valide et au moins un lot gagnable.

**Why:** l’utilisateur a défini la règle des tours et a demandé de ne pas créditer rétroactivement les achats passés.

**How to apply:** conserver l’attribution à l’achat direct et au parrain de premier niveau; ne pas inclure les achats gratuits ni les produits attribués par l’administration.

Les lots, leurs montants et images, les probabilités et le nombre de tours doivent rester configurables dans le panneau administrateur. Conserver les valeurs par défaut du code tant qu’un administrateur ne les a pas modifiées et enregistrées; ne pas préremplir la ligne wheelConfiguration dans la base.

**Why:** l’utilisateur veut pouvoir gérer tous les paramètres de la roue dans le panneau administrateur et a demandé de laisser les valeurs par défaut.

**How to apply:** garder la configuration par défaut disponible à l’application; enregistrer les changements uniquement à la demande de l’administrateur depuis le panneau.

Chaque tour n’est consommé qu’une fois, dans la même transaction que l’enregistrement du résultat. Le serveur choisit le lot au hasard selon les probabilités configurées. Les gains en espèces vont au solde des revenus; les lots matériels restent en attente jusqu’à confirmation de remise par un administrateur. Les lots désactivés restent affichés côté public, sans révéler les probabilités, mais ne doivent jamais être sélectionnés.

**Why:** l’utilisateur a choisi le crédit immédiat des gains en espèces et la remise des lots matériels après confirmation de l’administrateur, tout en demandant que rien ne change visuellement pour les lots désactivés.

**How to apply:** préserver l’atomicité du tirage et du crédit; garder le calcul des probabilités côté serveur et les contrôles de remise dans le panneau administrateur.
