# Chrome Web Store Listing Draft

This is a publication draft, not a live listing. Uploading, publishing, changing repository visibility, and choosing public support or privacy URLs require explicit approval.

## Product details

**Name:** Spottr

**Category:** Developer Tools

**Language:** English

**Manifest description, 97 characters:**

> Capture reproducible visual QA notes with local screenshots and JSON export. No account required.

**Short positioning:**

> Capture clear, reproducible visual QA feedback directly in your browser, without creating an account or sending screenshots to a third-party service.

## Detailed description

Spottr helps developers, designers, and QA practitioners turn frontend issues into useful, reproducible evidence while staying local-first.

Select an area of a regular webpage, add a concise note, and Spottr saves the cropped screenshot with the page URL, title, viewport, device pixel ratio, scroll position, and selection coordinates. Organize related observations into projects and QA sessions, then copy or download the active session as JSON.

Use Spottr for visual reviews, interaction checks, responsive QA, acceptance testing, or any browser-based feedback pass. Agency workflows, ecommerce storefronts, and issue trackers are optional downstream uses, not Spottr requirements.

Privacy is part of the product:

- No account or authentication
- No cloud synchronization
- No analytics, telemetry, advertising, or billing
- No automatic upload of screenshots or notes
- Local storage in the Chrome profile where Spottr is installed
- Data leaves Spottr only through an explicit Copy JSON or Export JSON action

Core beta features:

- Rectangle capture from the visible viewport
- Text-only QA notes
- Projects and QA sessions
- Note reassignment
- Screenshot viewer and local deletion
- Versioned JSON and clipboard export
- Configurable Chrome keyboard shortcuts
- Escape cancellation and keyboard-accessible note composer

Known limitations: Spottr captures the visible viewport only. Chrome blocks extensions on browser settings, the Chrome Web Store, extension pages, browser UI, local files without file permission, and some built-in viewers.

Review exports before sharing because screenshots, URLs, page titles, and written notes can contain sensitive information.

## Permission explanations

| Permission or resource | User-facing reason |
| --- | --- |
| `activeTab` | Gives Spottr temporary access to only the active webpage after the user clicks Spottr or invokes a configured command. Spottr does not request persistent access to all browsing. |
| `scripting` | Injects the rectangle selector and note composer into the active page after a user action. |
| `storage` | Stores project and session state locally. Notes and screenshots are stored in extension-scoped IndexedDB. |
| `clipboardWrite` | Writes an active-session JSON export to the clipboard only after the user clicks Copy JSON. Spottr never reads clipboard contents. |
| Web-accessible fonts | Makes two bundled Geist font files available to Spottr's injected interface on http and https pages. No remote font is loaded. |

The permission set intentionally omits persistent host permissions, `tabs`, downloads, history, cookies, identity, notifications, and `unlimitedStorage`.

## Privacy practices draft

Confirm the exact field names in the live Developer Dashboard before submission. Based on current behavior, disclose handling of:

- Website content, because a user can capture a selected screenshot and page title
- Web browsing activity, because a saved note includes the active page URL
- User-generated content, because a saved note includes text, project names, and session labels entered by the user

Declare that all handling is for app functionality; data is not sold, used for advertising or creditworthiness, transferred to third parties, or accessed by the developer. The behavior, published privacy policy, and dashboard answers must remain consistent.

## Required URLs

- **Homepage URL:** Pending a public location approved by the publisher
- **Privacy policy URL:** Pending a public location for `PRIVACY.md` or equivalent hosted content
- **Support URL:** Pending a public location for `SUPPORT.md` or the publisher's chosen support page

The repository is currently private, so repository links are not valid public listing URLs unless repository visibility is changed with explicit approval.

## Graphic asset checklist

Current Chrome listing guidance requests a 128 by 128 store icon, at least one 1280 by 800 screenshot with up to five total, a 440 by 280 small promo tile, and a YouTube product video. A 1400 by 560 marquee tile is optional. Verify the live Developer Dashboard requirements at upload time.

- [x] 128 by 128 PNG store icon at `icons/chrome/icon-128.png`
- [ ] Screenshot 1, 1280 by 800: welcome page with the local-first promise and quick start
- [ ] Screenshot 2, 1280 by 800: rectangle selection on a neutral `example.test` or local demo page
- [ ] Screenshot 3, 1280 by 800: note composer with a safe sample screenshot and project/session assignment
- [ ] Screenshot 4, 1280 by 800: popup showing a complete neutral QA session with screenshot and text-only notes
- [ ] Screenshot 5, 1280 by 800: redacted JSON export and the privacy boundary
- [ ] 440 by 280 PNG or JPEG small promo tile
- [ ] YouTube product walkthrough URL, if required by the live dashboard
- [ ] 1400 by 560 PNG or JPEG marquee promo tile, optional

Every asset must use neutral demo content. Do not include client names, access tokens, private repository details, local filesystem paths, personal bookmarks, extension IDs, or real production data.

Official references:

- [Prepare your extension](https://developer.chrome.com/docs/webstore/prepare)
- [Complete your listing information](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [Chrome Web Store user data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
- [activeTab permission](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)
- [Scripting API permission](https://developer.chrome.com/docs/extensions/reference/api/scripting)
