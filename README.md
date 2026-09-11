# Spottr

Capture clear, reproducible visual QA feedback directly in Chrome, without creating an account or sending screenshots to a third-party service.

Spottr is a local-first Chrome extension for developers, designers, and QA practitioners. Select part of a webpage, describe the issue, organize related notes into a QA session, then copy or download the evidence as JSON.

## Public beta status

Spottr 0.2.0 is being prepared for a public Chrome Web Store beta. The extension package can be built and tested locally, but it has not been published to the Chrome Web Store yet.

## What Spottr does

- Captures a rectangle from the visible webpage as a cropped WebP screenshot
- Creates text-only notes when a screenshot is not useful
- Records the page URL, normalized URL, page title, viewport, device pixel ratio, scroll position, selection coordinates, and timestamp
- Organizes notes into durable projects and bounded QA sessions
- Moves a saved note to another project or session without changing its capture evidence
- Stores notes and screenshots locally in the current Chrome profile
- Copies or downloads the active QA session as a versioned JSON document
- Supports keyboard capture commands configured through Chrome
- Cancels selection or the note composer with Escape

Spottr does not include accounts, cloud synchronization, team collaboration, billing, analytics, or issue-tracker integrations.

## Quick start

1. Open a regular http or https webpage.
2. Open Spottr and choose **Capture area**.
3. Drag around the issue. Press Escape if you want to cancel.
4. Describe what needs attention, confirm the project and QA session, then save.
5. Repeat for related issues. Use **Add text-only note** when a screenshot is unnecessary.
6. Use **Copy JSON** or **Export JSON** to hand off the active QA session.

The first saved note creates the suggested project and QA session. Projects persist across pages and tokenized preview URLs, so a changing preview parameter does not silently move your notes into a different workspace.

## Install for local testing

Spottr requires Chrome 102 or newer.

1. Run `npm test` and `npm run check`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select this repository directory.
5. Reload any webpage that was already open.
6. Open Spottr from the extensions menu and complete the first capture.

Keyboard commands are intentionally unassigned. Use **Configure keyboard shortcut** in Spottr or open `chrome://extensions/shortcuts` to choose bindings that do not conflict with another extension.

## Privacy at a glance

Spottr has no developer-operated server and makes no network requests. Notes and screenshots remain in the Chrome profile where they were captured. Data leaves Spottr only when the user explicitly copies or downloads an export and then chooses to share it.

Screenshots, page titles, URLs, and notes can still contain sensitive information. Review exported evidence before sharing it.

Read the complete [privacy notice](PRIVACY.md) and [support and troubleshooting guide](SUPPORT.md).

## Browser permissions

| Permission | Why Spottr needs it |
| --- | --- |
| `activeTab` | Temporarily accesses the current tab only after the user invokes Spottr. This avoids persistent access to every website. |
| `scripting` | Injects the selection overlay and note composer into the active page after a capture action. |
| `storage` | Stores project and session state locally with `chrome.storage.local`. Notes and screenshots use extension-scoped IndexedDB. |
| `clipboardWrite` | Copies the active QA session JSON only when the user chooses **Copy JSON**. Spottr never reads the clipboard. |

The bundled Geist fonts are declared as web-accessible resources so the injected interface can render consistently. No remote font or script is loaded.

## Export format

Exports use `schemaVersion: 1` and include only the active project and QA session. Screenshot data is embedded as a WebP data URL, so screenshot-heavy sessions can produce large JSON files.

See the [export format reference](docs/export-format.md) and [safe redacted example](docs/export-example.json).

## Known limitations

- Capture covers only the visible viewport, not an entire scrolling page.
- Chrome blocks extensions on browser settings, the Chrome Web Store, extension pages, browser UI, and some built-in viewers.
- Spottr does not request local file access. Serve local files over localhost before capturing them.
- Data does not expire automatically. Delete notes, clear a session or project, remove extension data, or uninstall Spottr to remove it.
- Very large screenshot-backed sessions may exceed browser storage or clipboard limits. Split them into smaller QA sessions when necessary.

## Development and release

```sh
npm test
npm run check
npm run build
```

`npm run build` runs the automated checks, creates an allowlisted `dist/spottr-v<version>.zip`, and writes its SHA-256 checksum. The manifest is placed at the ZIP root and development-only files are excluded.

Read the [release and packaging guide](docs/releasing.md), [Chrome Web Store listing draft](docs/chrome-web-store-listing.md), and [domain context](CONTEXT.md).

## Support

Start with [SUPPORT.md](SUPPORT.md). Public support and privacy URLs must be configured in the Chrome Web Store listing before publication.

## License

Spottr is available under the [MIT License](LICENSE).
