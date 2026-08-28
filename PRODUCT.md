# Product

## Register

product

## Users

**Passionnés de jeux de société** — collectionneurs, joueurs en session, organisateurs d'événements communautaires. Ils utilisent Loodi dans plusieurs contextes : chez eux pour gérer leur collection, en boutique ou bar à jeux pour trouver une partie, en festival pour repérer des stands et tournois.

Le besoin principal : **un hub unique** qui remplace une mosaïque d'apps, sites, et documents. Ils veulent accéder à leur collection, à leur planning, aux événements à proximité — sans changer d'application.

## Product Purpose

Loodi est le conteneur unifié de l'écosystème Loodi. Une seule app native sur le store, qui fournit aux modules PWA (Loodi, Mate, Mag, Places, Fest, Planner) des services partagés : auth, navigation, thème et bridge de communication. Le POC les charge dans des iframes ; le MVP de production les isole dans des WebViews natives persistantes. L'utilisateur n'a jamais besoin de télécharger une autre app — chaque nouveau module arrive via une mise à jour serveur.

## Brand Personality

**Ludique & chaleureuse.** Loodi parle à une communauté de joueurs — le ton est accueillant, jamais froid ni corporate, mais jamais non plus enfantin ou cartoon. La marque évoque la complicité autour d'une table de jeu : sérieuse sur le fond (la gestion de collection, les données), légère sur la forme (micro-interactions, découvertes visuelles).

Trois mots : **communautaire, confiant, généreux.**

## Anti-references

Pas d'anti-références précises. Éviter :
- **Le look « SaaS froid »** — bleu-gris corporatif, trop utilitaire, sans âme.
- **Le look « jouet »** — trop enfantin, pastel, arrondi excessif. La chaleur doit venir du fond, pas des fioritures.

## Design Principles

1. **Le shell s'efface** — L'utilisateur est immergé dans son module. Le shell (header, nav, launcher) ne prend pas le dessus visuellement, mais reste accessible en un geste. C'est un cadre, pas le tableau.

2. **Cohérence d'écosystème** — Chaque module (Mate, Mag, Places…) a sa propre identité (couleur d'accent, icône) mais tous sont immédiatement reconnaissables comme faisant partie de Loodi. L'unité vient du shell, la diversité des modules.

3. **Friction minimale** — Passer d'un module à l'autre, lancer une app depuis le launcher, régler le thème : chaque action est à un geste ou moins. Pas de menu hamburger, pas de hiérarchie cachée.

4. **Chaleureux sans être enfantin** — La personnalité ludique s'exprime dans les couleurs (orange chaud, tons naturels), les micro-interactions, la typographie, pas dans des mascottes ou des décorations excessives.

5. **Natif dans l'âme** — L'expérience doit se fondre dans le système d'exploitation : safe areas, thème système, gestes natifs, transitions fluides. L'utilisateur ne devrait jamais se dire « c'est une web app ».

## Accessibility & Inclusion

- **WCAG AA** comme socle minimal.
- Thème clair/sombre disponible (auto, clair, sombre).
- `prefers-reduced-motion` respecté pour toutes les animations.
- Contraste suffisant sur tous les textes (body ≥ 4.5:1, large ≥ 3:1).
- Navigation clavier et VoiceOver / TalkBack compatibles.
