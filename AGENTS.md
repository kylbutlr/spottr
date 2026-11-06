## App Stylr

Spottr follows [App Stylr v1.4.1 source](https://github.com/kylbutlr/app-stylr/tree/v1.4.1).

- Keep extension pages dark-first with the generated App Stylr semantic tokens and bundled Geist fonts.
- Use Geist Mono for technical metadata such as URLs, viewport values, IDs, and timestamps.
- Use mint as the primary action color with Ink text in dark mode.
- Use restrained borders, precise corners, and selective depth. Do not add decorative shadows to normal rows.
- Keep the injected page UI inside Shadow DOM so host storefront CSS cannot change its behavior or hierarchy.
- Review the [Visual Reference and Style Guide](https://kylbutlr.com/app-stylr) before interface changes.
- Record intentional deviations in `docs/app-stylr-exceptions.md`.
- Keep the creator handle styled as `kylbutlr` if creator attribution is ever added.

## Generated foundation

Run `npm run styles` after changing the exact App Stylr dependency or icon master, then `npm test`. The sync script owns the CSS/font adapters, bitmap exports, and marked Shadow DOM token block in `content.js`. Keep injected interaction logic outside that generated block. Preserve the existing focus-mark glyph and isolated Shadow DOM behavior.
