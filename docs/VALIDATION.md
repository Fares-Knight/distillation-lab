# Validation et portée des résultats

Ce document distingue les contrôles historiques de la V1 et ceux de sa préparation pour GitHub. Il ne constitue ni une certification scientifique, ni un audit universel d’accessibilité, ni une mesure de l’apprentissage. Les rapports bruts et données de pilotage sont conservés localement, hors de la présentation publique.

## Préparation GitHub — 25 octobre 2026

| Contrôle | Résultat établi |
|---|---|
| Tests du dépôt de travail | **8 tests réussis sur 8** |
| Build du dépôt de travail | **Réussi**, avec avertissement de taille du bundle : JavaScript 612,05 ko, 156,20 ko gzip |
| Dépendances | `npm audit` exécuté en ligne : **0 vulnérabilité signalée** pour les versions verrouillées |
| Secrets | Gitleaks 8.30.1 : aucune détection sur l'historique local complet et les fichiers propres au projet, build et ancienne archive compris ; revue ciblée complémentaire |
| Installation depuis une copie propre | `npm ci` réussi depuis un cache vide, sans `.tools/`, configuration personnelle ou dépendances locales dans la copie ; Node 24.22.0 fourni par l'environnement |
| Tests et build de cette copie | **8/8 réussis**, build réussi ; JavaScript et CSS identiques au build applicatif antérieur, notices tierces complétées |
| Distribution locale par HTTP | **13 contrôles réussis** : ressources conformes au build, CSP locale, méthodes HTTP et refus des chemins de pilotage ; aucun rendu navigateur déduit de ces tests HTTP |
| Liens et image | Liens relatifs présents, capture inspectée sans donnée personnelle visible ni métadonnée EXIF/XMP/IPTC/commentaire ; quatre sources répondent, avec réserve ACS ci-dessous |
| Publication distante, rendu GitHub et CI | En attente de la vérification de publication ; aucun résultat de CI revendiqué à ce stade |

L’avertissement de taille ne bloque pas le build. La taille du fichier ne constitue pas une mesure du temps de chargement.

Le serveur ACS a renvoyé du HTML à la requête HTTP directe malgré l'extension PDF ; le document PDF de deux pages a pu être consulté par l'outil de recherche Web, et sa page 2 confirme l'affirmation utilisée. Les trois autres références ont répondu avec le type attendu. Aucune garantie de disponibilité continue n'est déduite de ces contrôles.

## Vérifications de la V1 — 18 octobre 2026

Les tests Node couvrent les bornes, l’état initial/final, les étapes, les voisinages des événements et 1 001 instants parcourus dans les deux sens. Ils contrôlent la causalité des phénomènes, la conservation des quantités graphiques et la relation entre collecte et transfert. **Ils ne rendent pas la scène dans un navigateur.**

Les vérifications navigateur ont observé Chrome 155 et Edge 155, avec WebGL2, aux formats 1366×768 et 1920×1080 :

- Retour **80→20→80** comparé à l’accès direct à 80 % : modèle, objets 3D appliqués, DOM et caméra identiques ; captures identiques au sein de chaque paire. La paire Chrome précède le dernier réglage des vues prédéfinies ; la paire Edge utilise leur version finale.
- Caméra active en pause, état scientifique inchangé, rotation complète, zoom et vues inspectés.
- Sept composants sélectionnés au clavier et par clic 3D, sélection persistante et texte actualisé lors d’un changement d’instant.
- Vitesses proportionnelles, mise en pause par la frise et masquage des symboles vérifiés.
- Absence de débordement horizontal et d’erreur consignée dans les parcours documentés.

| Mesure après échauffement | Durée | Médiane | 95e centile du temps d’image |
|---|---:|---:|---:|
| Chrome, 1920×1080 | 30,004 s | 59,88 images/s | 16,8 ms |
| Edge, 1366×768 | 30,005 s | 59,88 images/s | 16,8 ms |

Ces mesures concernent le poste testé, équipé d’un GPU Intel Iris Xe. Elles ne garantissent pas la même fluidité sur un autre appareil.

Le build local a fonctionné dans les deux navigateurs sous une politique CSP interdisant les ressources distantes. Le système restait connecté à Internet. Le repli WebGL a été testé par injection de `?webgl=off`, sans reproduire une panne réelle de GPU ou de pilote.

## Capture et périmètre de livraison

La [capture du README](images/distillation-lab.jpg) provient d'un contrôle réel du 18 octobre 2026, à l'étape Collecte, avec le réfrigérant sélectionné. L'ancienne démonstration hébergée a ensuite été supprimée par son propriétaire. La livraison GitHub du 25 octobre porte sur le code et le lancement local uniquement ; aucun site de démonstration n'est prévu.

Aucun navigateur pilotable n'était connecté lors de la reprise du 25 octobre ; aucune nouvelle inspection visuelle ni nouvelle mesure de fluidité n'est revendiquée à cette date. Le scanner de secrets ne prouve pas l'absence absolue de donnée sensible ; ses résultats sont limités aux fichiers et références effectivement examinés. Les outils et dépendances tiers installés ne sont pas assimilés au code source destiné à publication.

## Limites conservées

La version mobile, les autres navigateurs et les lecteurs d’écran n’ont pas été validés. Les contrôles clavier ne constituent pas un audit complet avec technologies d’assistance. La compréhension d’apprenants réels n’a pas été mesurée. Les [hypothèses scientifiques](SCIENCE.md) limitent le scénario à une explication qualitative ; aucun résultat de laboratoire n’est prédit.
