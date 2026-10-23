# Spottr Privacy Notice

Effective October 22, 2026. This notice covers Spottr's downloadable Chrome extension.

Spottr is a local-first Chrome extension for capturing, organizing, and exporting frontend QA evidence. It has no account system, developer-operated server, cloud synchronization, analytics, advertising, or telemetry.

## Data Spottr handles

When a user saves a note, Spottr stores:

- The note text entered by the user
- A WebP crop of the selected visible viewport, when the user chooses a screenshot-backed note
- The raw page URL, if Chrome provides it or the user enters it
- A normalized page URL with common temporary token parameters removed
- The page title, if Chrome provides it or the user enters it
- Viewport width and height, when available
- Device pixel ratio, when available
- Horizontal and vertical scroll position, when available
- Selection rectangle coordinates and size
- Project and QA session names and local identifiers
- Capture and export timestamps

Spottr does not read cookies, page form values, browsing history outside the active tab, clipboard contents, authentication state, or network traffic.

## Where data is stored

Notes and screenshots are stored in IndexedDB within Spottr's extension origin. Project, QA session, and active-workspace state are stored in `chrome.storage.local`. The data is local to the Chrome profile where Spottr is installed. Spottr does not use `chrome.storage.sync`.

For **Capture area** on a restricted page, Spottr first stores a full visible-tab screenshot as a temporary local draft in IndexedDB so you can select a rectangle in Spottr's own editor. Only the selected WebP crop is saved with the note. **Add text-only note** opens the editor without taking a screenshot. Saving or discarding a draft removes it; starting another restricted-page capture replaces an unfinished draft. Closing the editor without saving or discarding leaves the draft locally until the next restricted-page capture or extension-data removal.

Chrome's storage documentation states that `chrome.storage.local` data is cleared when an extension is removed. Extension IndexedDB is also part of the extension's local origin and is not synchronized by Spottr.

## What leaves the browser

Spottr does not automatically transmit saved evidence. Data leaves Spottr only when the user intentionally:

- Chooses **Copy JSON**, which writes the active QA session export to the clipboard
- Chooses **Export JSON**, which downloads the active QA session as a local file
- Shares that copied or downloaded export through another application or service

Spottr does not send data to its developer or any third party.

## Retention and deletion

Spottr does not automatically expire saved data.

- **Delete** removes one note and its screenshot.
- **Clear session notes** removes every note and screenshot in the active QA session while retaining the empty session and project.
- **Clear project notes** removes every note and screenshot in the active project while retaining the empty project and sessions.
- **Delete empty session** removes an empty QA session.
- **Delete empty project** removes an empty project and its empty sessions.
- **Discard screenshot** removes a temporary restricted-page capture draft.
- Removing Spottr or its extension data through Chrome removes its locally stored data.

Deletion is local and immediate. Spottr has no server-side copy to delete.

## Permissions and access

Spottr uses `activeTab` rather than persistent host access. It receives temporary access to the active tab only after the user clicks a capture action or invokes a configured Spottr shortcut. It uses `scripting` to show the selection overlay and note composer on regular webpages. On restricted pages, it opens its own editor without reading that page's DOM, using Chrome's screenshot API only for **Capture area**. It uses `storage` for local project and session state, and `clipboardWrite` only for the user-initiated Copy JSON action.

## Sensitive information

Screenshots, URLs, page titles, and note text can contain confidential, personal, authentication, or customer information. Users should review and redact evidence before sharing it. Spottr does not automatically inspect or redact saved evidence.

## Use of captured data

Spottr's handling of user data is limited to providing its single purpose: user-initiated capture, organization, local review, and export of frontend QA evidence. Spottr does not sell user data, use or transfer it for advertising or creditworthiness, transfer it to data brokers, or permit human access by the developer.

## Changes and support

If Spottr's data handling changes, this notice must be updated before that change is published. For troubleshooting, see [SUPPORT.md](SUPPORT.md) or the [public issue tracker](https://github.com/kylbutlr/spottr/issues).

Chrome references:

- [Chrome extension storage](https://developer.chrome.com/docs/extensions/reference/api/storage)
- [Chrome activeTab permission](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)
