# Maxi Bazar

Catalogue partagé de fournisseurs et préparation de commandes, avec synchronisation via Netlify Database.

## Déploiement

Le site reste une page HTML statique, sans étape de compilation. Netlify déploie la fonction `netlify/functions/catalog.mts` et applique les migrations de `netlify/database/migrations`. La connexion à Netlify Database est configurée automatiquement ; aucune clé Firebase n'est nécessaire.

Le premier appareil connecté initialise la base vide avec son catalogue local existant, ou avec le catalogue par défaut en l'absence de sauvegarde locale. Pour reprendre un catalogue existant, ouvrez d'abord le site sur l'appareil qui le possède. Les appareils suivants récupèrent le catalogue partagé. L'historique des commandes reste local, comme auparavant.

## Synchronisation

Les modifications sont envoyées après chaque sauvegarde. Le catalogue partagé est vérifié toutes les dix secondes, au retour de la connexion et au retour sur l'onglet. Le statut « Synchronisé » apparaît seulement après une réponse réussie du serveur.

En cas de coupure réseau, le catalogue et les modifications en attente restent dans le stockage du navigateur et sont renvoyés automatiquement, y compris après rechargement. Ne supprimez pas les données du navigateur avant leur synchronisation. Cliquez sur le statut pour réessayer immédiatement.

Si un autre appareil a modifié le catalogue entre-temps, la synchronisation est bloquée plutôt que d'écraser ses changements. Le statut permet de confirmer explicitement le remplacement par la version locale ; annuler conserve les modifications locales sans les envoyer. Une sauvegarde JSON peut être exportée depuis le mode édition avant de résoudre ce conflit.

L'application conserve son fonctionnement partagé sans authentification : toute personne ayant accès au site peut lire et modifier le catalogue. Le mode édition ne constitue pas une protection d'accès.

## Vérification

Installez les dépendances avec `npm install`, puis vérifiez les types avec `npm run typecheck`. Pour tester le site et ses fonctions localement, utilisez `netlify dev --port 8889`.

Définissez toute évolution de schéma dans `db/schema.ts`, vérifiez l'état des migrations avec `netlify db status`, puis générez une migration nommée avec `npx drizzle-kit generate --name nom_descriptif`.
