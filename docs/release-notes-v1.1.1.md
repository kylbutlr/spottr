# Spottr v1.1.1

- Explain that JSON exports include original page URLs and screenshots, with guidance to review them before sharing.
- Show shortcut hints only after a shortcut is assigned, including when Chrome returns an empty command binding. Settings clarify that keyboard shortcuts are optional.
- Name downloaded exports using the project, QA session and UTC export date. Names are bounded and filesystem-safe; the original evidence and schema version 1 are preserved.

The App Stylr v1.4.1 foundation, Graphite icons, permissions and local storage model are retained. The pinned styling archive is bundled locally so installation does not depend on an old GitHub commit ID.

## Installation and support

Requires desktop Chrome 102 or newer. Extract the extension ZIP and use Developer mode and **Load unpacked**. Updates are manual; keep the same installation folder and follow [installation and updates](installing.md). Export important sessions before updating.

See [privacy](../PRIVACY.md) and [support](https://github.com/kylbutlr/spottr/issues).

## Verification and coverage

The release owner approved focused acceptance for this patch on November 7, 2026. Automated/package checks, the corrected native shortcut hints, text-only note saving and a real JSON download passed. The broader capture, update/persistence, clipboard and native workflow matrix is explicitly deferred for v1.1.1; those checks have not been marked passed.

See the [v1.1.1 candidate verification](release-verification-v1.1.1.md) for exact coverage, checksums and exclusions. This decision applies only to v1.1.1 and does not change the standard release checklist. Publication requires separate approval.
