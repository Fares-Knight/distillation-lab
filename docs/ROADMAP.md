# Reste à faire

État de la revue du **25 octobre 2026**. Ces éléments décrivent des limites et des possibilités ; ils ne constituent pas un engagement de réalisation ni un calendrier. **P2** indique un travail à envisager lors d’une évolution concernée ; **P3**, une amélioration optionnelle. Les sources ci-dessous permettent de distinguer les constats des suggestions.

## État des catégories

- **Bugs confirmés ouverts :** aucun identifié par la revue documentaire et statique. Les défauts historiques d’inertie après recentrage et de clic après glisser ont été corrigés ; cela ne prouve pas l’absence de toute anomalie.
- **Fonctionnalités commencées mais incomplètes :** aucune identifiée dans le parcours V1.
- **Fonctionnalités prévues et attestées :** aucune extension engagée après la V1. Aucun `TODO` ou `FIXME` trouvé dans les sources lors de cette revue.
- **Dette et limites :** décrites ci-dessous, séparément des suggestions nouvelles.

## Dette technique et limites connues

| Élément / priorité | Source et impact | Dépendance ou décision | Critère d’acceptation |
|---|---|---|---|
| Cycle de destruction de la scène — P2 conditionnel | [`dispose()`](../src/scene.js) ne libère pas explicitement tous les matériaux, géométries et écouteurs ; pertinent si la scène est remontée plusieurs fois | Une intégration avec démontage/remontage ; pas nécessaire au parcours actuel créé une fois | Créations/destructions répétées sans accumulation de ressources ni gestionnaires ; commandes intactes après remontage |
| Lecteurs d’écran — P2 | [Validation](VALIDATION.md) : contrôle clavier effectué, technologies d’assistance non validées | Définir le lecteur d’écran et le navigateur cibles | Parcours composants/frise/dialogue documenté, focus correct et annonces sans répétition excessive |
| Mobile et autres navigateurs — P3, hors V1 | [Validation](VALIDATION.md) : couverture actuelle Chrome/Edge sur ordinateur | Décision de périmètre et matrice de terminaux | Parcours essentiels, lisibilité et gestes vérifiés sur la matrice convenue |
| Efficacité pédagogique — P3 | [Validation](VALIDATION.md) : aucun test d’apprentissage | Public et protocole d’évaluation à convenir | Observations documentées sur la compréhension des changements d’état, du sel restant et des deux circuits |

## Suggestions, sans engagement

| Élément / priorité | Source et impact | Dépendance ou décision | Critère d’acceptation |
|---|---|---|---|
| Repères « entrée / sortie » — P3 | Suggestion de la revue géométrique du 18 octobre ; aider à identifier les raccords de refroidissement | Choix de lisibilité, sans modifier la séparation des circuits | Repères bas/haut lisibles après rotation et sans masquer les conduits |
| Tests navigateur reproductibles — P2 | Suggestion de cette revue ; les tests versionnés couvrent le scénario, tandis que les preuves visuelles historiques sont ponctuelles | Choix d’un outil et d’un environnement WebGL de test | Parcours 80→20→80 sur objets/DOM/caméra, pause et sélection exécutables avec captures de contrôle |
| Mesure du chargement — P3 | Suggestion de cette revue ; [avertissement de taille du bundle](VALIDATION.md) | Définir un appareil et un profil réseau avant d’optimiser | Mesure reproductible ; éventuelle optimisation sans régression du rendu ni des interactions |

Un quiz, une simulation physique réglable, un autre mélange, une lecture inverse continue ou un déplacement entièrement libre ne font pas partie de la V1. Les développer demanderait un nouveau choix de périmètre, pas la correction d’un défaut existant.
