# Publication des packages npm

Ce guide couvre `@loodi/bridge` et `@loodi/ui`.

## Décision

La voie normale est une publication **CI/CD depuis une release Git taggée**, jamais depuis un poste de développement. Le poste local est réservé à :

1. la toute première publication, pour créer les packages npm ;
2. une publication de secours explicitement décidée ;
3. le développement inter-repos avec `npm link`, qui ne publie rien.

Le workflow cible est : PR → validation → commit de release → tag → CI → npm. Les deux packages sont versionnés indépendamment : une correction du bridge n'impose pas une nouvelle version de l'UI.

## Règles de version

| Changement | Version |
| --- | --- |
| Correction interne sans changement de contrat public | `patch` |
| Ajout rétrocompatible d'une méthode, événement, composant, prop optionnelle ou token | `minor` |
| Suppression ou changement incompatible d'une API, prop, événement, CSS/token public | `major` |

Pour le bridge, être conservateur : One doit prendre en charge un ajout avant qu'il soit livré aux PWA. Un changement incompatible nécessite une période de coexistence ou une majeure.

Une version npm publiée est immuable : ne jamais tenter de republier la même version. En cas d'erreur, publier un correctif supérieur et, si nécessaire, déprécier la version fautive.

## Premier bootstrap manuel

À faire une seule fois, depuis une branche propre et relue. Les versions actuelles sont `0.1.0` : ne les incrémenter que si elles ont déjà été publiées.

### 1. Préparer npm

1. Créer ou vérifier l'organisation npm `@loodi` et donner les droits de publication au compte utilisé.
2. Activer la 2FA sur ce compte.
3. S'authentifier puis vérifier le compte :

```bash
npm login
npm whoami
```

### 2. Vérifier exactement ce qui sera publié

Depuis la racine du monorepo :

```bash
npm ci
npm run test:run -w @loodi/one
npm run build:packages
npm run build -w @loodi/one
npm pack --dry-run -w @loodi/bridge
npm pack --dry-run -w @loodi/ui
```

`npm pack --dry-run` est la dernière barrière : vérifier que chaque archive contient seulement `dist/`, les déclarations TypeScript et le README — jamais `src/`, `node_modules`, secrets ou fichiers de test.

### 3. Publier

Les packages sont indépendants ; publier seulement celui qui a changé. Pour le premier envoi :

```bash
cd packages/@loodi/bridge
npm publish --access public

cd ../ui
npm publish --access public
```

Puis contrôler le registre :

```bash
npm view @loodi/bridge version
npm view @loodi/ui version
```

Les sources vérifiées doivent être commitées avant publication. Une fois celle-ci réussie, tagguer ce commit explicitement, par exemple `bridge-v0.1.0` ou `ui-v0.1.0`.

## Publication manuelle exceptionnelle d'une version suivante

Ne pas employer ce chemin pour la routine une fois la CI mise en place. Si nécessaire :

```bash
# Depuis la racine : ne change que le package indiqué, sans créer de tag local automatique.
npm version patch --workspace=@loodi/bridge --include-workspace-root=false --no-git-tag-version
npm install --package-lock-only --ignore-scripts

npm run test:run -w @loodi/one
npm run build:packages
npm pack --dry-run -w @loodi/bridge

cd packages/@loodi/bridge
npm publish --access public
```

Remplacer `patch` par `minor` ou `major` selon le contrat. Commiter ensuite `packages/@loodi/bridge/package.json` et le `package-lock.json` de One, créer le tag correspondant, puis mettre à jour les consommateurs via une PR séparée.

## CI/CD recommandée : GitHub Actions + trusted publishing

> État actuel : aucun remote Git ni workflow GitHub Actions n'est encore configuré dans ce dépôt. Cette section décrit la cible ; elle ne constitue pas une publication automatique déjà active.

Utiliser le *trusted publishing* npm avec OIDC, pas un `NPM_TOKEN` d'écriture stocké dans GitHub. npm accepte alors seulement des jetons temporaires émis pour le workflow autorisé. Cette méthode requiert npm `11.5.1+`, Node `22.14+` et un runner GitHub hébergé ; le poste local actuel satisfait déjà ces versions.

### Pré-requis à configurer une fois

1. Héberger le dépôt sur GitHub et renseigner le champ `repository` exact dans les `package.json` publiés. Il est requis pour la provenance npm.
2. Créer `.github/workflows/publish-npm.yml` dans le dépôt.
3. Sur npmjs.com, pour **chaque** package : **Settings → Trusted Publisher → GitHub Actions**.
   - Organisation/utilisateur GitHub ;
   - nom du dépôt ;
   - fichier `publish-npm.yml` ;
   - environnement GitHub `npm-production` (recommandé) ;
   - action autorisée : `npm publish`.
4. Créer l'environnement GitHub `npm-production` et exiger une approbation manuelle avant le job de publication.
5. Une fois une première publication OIDC réussie, dans npm **Settings → Publishing access**, choisir « Require two-factor authentication and disallow tokens » et révoquer tout ancien token d'écriture.

Chaque package npm ne peut avoir qu'un seul trusted publisher à la fois. Si le dépôt GitHub est privé, la publication OIDC reste possible mais npm ne générera pas d'attestation de provenance.

### Deux workflows, deux responsabilités

**Validation PR** — à chaque pull request :

```text
npm ci
→ npm run test:run -w @loodi/one
→ npm run build:packages
→ npm run build -w @loodi/one
→ npm pack --dry-run pour bridge et ui
```

**Release** — déclenchée seulement sur un tag protégé `bridge-v*` ou `ui-v*`, après le merge du commit qui contient la nouvelle version. Elle vérifie que le tag et la version de `package.json` concordent, puis publie uniquement le workspace concerné.

Le job de release doit au minimum demander les permissions suivantes :

```yaml
permissions:
  contents: read
  id-token: write
```

Puis exécuter `npm ci`, les mêmes tests/builds que la PR et enfin `npm publish` dans le workspace concerné. Avec trusted publishing, aucun secret `NPM_TOKEN` d'écriture n'est nécessaire ; npm génère automatiquement la provenance pour un dépôt et un package publics.

### Versionnage automatisé : cible recommandée

Installer **Changesets** lors de la mise en place de la CI : chaque PR qui modifie une API publique ajoute une note indiquant le package et le niveau semver. Le bot crée ensuite une PR de release qui met à jour les versions, changelogs et lockfile. Après merge, le tag déclenche la publication OIDC.

Cette étape est volontairement distincte de la première publication : elle implique l'ajout de la dépendance Changesets et d'un workflow GitHub, donc une décision de dépôt/organisation qui reste à prendre.

## Après la release

1. Vérifier la version publiée avec `npm view @loodi/<package> version`.
2. Vérifier la provenance avec `npm audit signatures` depuis un projet consommateur si le dépôt est public.
3. Ouvrir une PR dans Collec pour remplacer uniquement les versions semver attendues et mettre à jour son `package-lock.json` avec `npm install`.
4. Tester Collec avec la version npm publiée, pas avec un lien local.
5. Annoncer dans la release le contrat bridge ou les props/tokens UI ajoutés.

## Incident après publication

- Ne pas supprimer une version déjà consommée.
- Publier un `patch` correctif au plus vite.
- Déprécier la version fautive sur npm avec un message de migration si elle est dangereuse.
- Pour un bridge incompatible, garder la compatibilité côté One pendant la migration des PWA ou publier une majeure accompagnée d'un guide d'adaptation.

## Références npm

- [Trusted publishing avec OIDC](https://docs.npmjs.com/trusted-publishers/)
- [2FA et accès de publication](https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/)
- [Provenance npm](https://docs.npmjs.com/generating-provenance-statements/)
