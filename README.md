# Spottr

Screenshot-backed feedback for frontend reviews.

Spottr is a free, public-source Chrome extension for developers, designers, and QA teams. Capture an area of a page, describe the issue, and organize the evidence into projects and QA sessions. Copy or download a session as JSON when it is ready to share.

[Releases](https://github.com/kylbutlr/spottr/releases) · [Installation and updates](docs/installing.md) · [Privacy](PRIVACY.md) · [Report an issue](https://github.com/kylbutlr/spottr/issues)

## Install

Spottr is distributed through GitHub downloads. It is not distributed through the Chrome Web Store. Find published packages in Releases; if no release is listed, load the source locally using the same steps below.

1. Download the extension ZIP and its SHA-256 file from [Releases](https://github.com/kylbutlr/spottr/releases) when available, then extract the ZIP into a permanent folder. For source installation, clone this repository instead.
2. Open `chrome://extensions` in Chrome and enable **Developer mode**.
3. Choose **Load unpacked** and select the extracted folder containing `manifest.json`.
4. Pin Spottr from Chrome's Extensions menu, then reload the webpage you want to review.

No Node.js installation or build step is needed to use a release ZIP. Spottr requires Chrome 102 or newer. Downloads are updated manually; follow the [update guide](docs/installing.md) before replacing an installed version.

## Use Spottr

1. Open the page you want to review and choose **Capture area** in Spottr.
2. Drag around an issue, then describe it. Press Escape to cancel.
3. Confirm the project and QA session, then choose **Save note**.
4. Repeat for related issues. Choose **Add text-only note** when a screenshot is unnecessary.
5. Review the saved notes and choose **Copy JSON** or **Export JSON** to share the active session.

A screenshot note includes the selected WebP crop, page URL and title, viewport dimensions, device pixel ratio, scroll position, selection coordinates, and capture time when available. Projects and sessions persist across pages, and a saved note can be moved without changing its original capture context.

Use **Keyboard shortcuts** to configure Chrome's capture commands. Shortcuts are unassigned initially so you can choose bindings that fit your workflow.

## Your data stays local

Spottr has no account, developer-operated server, analytics, or cloud synchronization. Notes and screenshots stay in the Chrome profile where they were captured. Spottr makes no network requests; evidence leaves the extension only when you copy or download an export and choose to share it.

Screenshots and URLs can contain private information. Review an export before sharing. Local storage is not a backup: removing the extension or its data removes the saved evidence. Export important sessions first.

Read the [privacy notice](PRIVACY.md), [support guide](SUPPORT.md), and [export format](docs/export-format.md).

| Permission | Purpose |
| --- | --- |
| `activeTab` | Temporary access to the current tab after you invoke Spottr. |
| `scripting` | Shows the area selector and note composer on the current page. |
| `storage` | Stores project and session state locally; notes and screenshots use IndexedDB. |
| `clipboardWrite` | Copies a session export when you choose Copy JSON. Spottr never reads the clipboard. |

Spottr does not request persistent access to every website. Fonts and scripts are bundled locally.

## Capture limits

- Capture covers the visible viewport, not a full scrolling page.
- Restricted pages use Spottr's own screenshot editor. Chrome may hide the source URL or title, or deny capture entirely.
- Local `file://` access is not requested. Serve local files over localhost before capturing them.
- Screenshot-heavy JSON files can be large. Use smaller QA sessions if storage or clipboard limits become a problem.
- Notes remain until you explicitly delete them. Clearing notes keeps the empty project and session available.

## Development

Use Node.js 22 (`nvm use`), npm, and the `zip` command. There are no third-party runtime or npm dependencies.

```sh
npm run check
npm test
npm run build
```

The build checks the source and manifest, runs the tests, and creates an allowlisted extension ZIP and SHA-256 file in `dist/`. CI runs the same build and retains its artifacts. A successful build does not publish a release or establish installed-browser acceptance.

See [release verification and publication](docs/releasing.md) and the [domain model](CONTEXT.md). The interface follows [App Stylr v1.2.0](https://github.com/kylbutlr/app-stylr/tree/b3ca31ea264d5dd233fd871ac167247f1c306985), with bundled Geist fonts and a Shadow DOM interface isolated from host-page styles. [Implementation notes](docs/app-stylr-exceptions.md) describe product-specific choices.

## Support and license

Use the [issue tracker](https://github.com/kylbutlr/spottr/issues) for reproducible bugs and suggestions. Include your Spottr and Chrome versions, steps to reproduce, and the on-screen error. Never include credentials, private URLs, or confidential screenshots.

Created by [kylbutlr](https://kylbutlr.com/apps/spottr). Available under the [MIT License](LICENSE).
