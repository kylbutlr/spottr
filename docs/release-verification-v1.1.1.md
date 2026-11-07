# Spottr v1.1.1 candidate verification

Status: local candidate with focused patch acceptance approved on November 7, 2026. No push, PR, merge, tag or GitHub Release was performed for this patch preparation. Publication approval remains pending.

## Source and automated checks

- Runtime polish base: `e47f97ecc5c31451e37e12870db1a961f9f620bd` on `main`. Patch preparation includes version metadata, release notes and a native-review correction: the background shortcut response preserves empty bindings so the popup can hide unassigned hints.
- App Stylr remains pinned to v1.4.1 through its preserved local archive. The generated-source check passed.
- Runtime: Node v22.23.1. Commands: `npm ci --offline --no-audit --no-fund`, `npm run build`, `npm run package`.
- Automated tests: 54 passed; zero failures, skips or cancellations.
- Each package passed ZIP integrity, an exact runtime allowlist comparison and a byte-for-byte comparison of every file against the candidate source. No development files were included.
- Repeated packaging produced the same SHA-256. Existing older version ZIPs and versioned checksums were unchanged.

## Package checksums

| File | SHA-256 |
| --- | --- |
| `spottr-v1.1.1.zip` | `d94cb774ab510303028acc866550af16e4f9b3dced0525897f55fc919296dc7f` |

## Installed Chrome review and remaining acceptance

A focused installed-package pass used Google Chrome 157.0.8103.38 on macOS and a disposable profile. Chrome's extension-debugging API read back the enabled package as version 1.1.1. Real browser APIs, extension messaging and IndexedDB were used; no fictional browser API adapter was used.

The first native popup exposed a defect missed by the earlier adapter-based review: the background returned the literal string `Not set` for unassigned commands, so the popup treated it as a binding. The background now returns an empty string. The new regression test exercises the actual message handler with empty, missing and assigned Chrome commands. It failed before the correction and passed afterward; the complete suite now has 54 passing tests.

Passed with the rebuilt ZIP:

- The fully loaded native toolbar popup hides both unassigned shortcut hints. The original and corrected native popup screenshots were reviewed at 2x display density.
- A native toolbar action opened the restricted-page text-only-note fallback. A fictional URL, title and note were entered with ordinary UI input; Enter saved the note and displayed the success state.
- Reopening the installed popup page showed the saved note and export-sharing guidance. This populated-page check used the installed extension page in a tab, not the native toolbar popup.
- Clicking Export JSON completed a real browser download named `spottr-restricted-page-qa-2026-11-07-2026-11-07.json`. The downloaded file retained schema version 1, exactly one text-only note, its fictional URL and original message, with no screenshot data.

Loading the rebuilt extension into an existing debug profile reused the first candidate's registered worker. Verification therefore used a fresh extraction path and extension ID for the rebuilt package. This establishes fresh installed behavior, not same-folder update acceptance. The debug loader did not retain the temporary extensions across browser exit; normal install/update persistence is not established by that environment.

## Approved patch scope and deferred checks

On November 7, 2026, the release owner explicitly selected: "Use focused patch scope; document deferred checks." Acceptance for v1.1.1 is limited to the automated/package checks and changed flows recorded as passed above, including the native shortcut correction. Those checks satisfy the approved local patch scope. This is not a full native-browser acceptance verdict or authorization to publish.

The following checks remain unverified and are explicitly excluded from the acceptance gate for v1.1.1 only:

- Ordinary-page area capture, crop geometry at different display scaling/zoom, the selector and screenshot viewer, and screenshot-heavy evidence flows.
- Same-folder update preservation, browser restart/long-term persistence and service-worker lifecycle. The debug-loader behavior above does not establish those outcomes.
- Assigned native keyboard shortcuts, actual clipboard completion, the full project/session creation/switching/reassignment/deletion matrix, multiline note coverage and storage/clipboard/download failure paths.
- The complete responsive, keyboard, focus, zoom, onboarding, help and accessibility matrix beyond the changed states reviewed above, plus any other standard [release checklist](releasing.md#verify-the-exact-package) item not explicitly recorded as passed in this versioned report.

Reason: this patch has a deliberately bounded changed-flow review; the broader inherited matrix was not completed in this pass. Deferred does not mean passed. The shared clipboard was left untouched. Follow-up owner: the release-preparation agent during the next broader native-browser QA effort. No deadline or additional QA run was requested by this scope decision.

The standard release checklist is unchanged for future releases. Code, permissions, the App Stylr pin and package checksums are unchanged by this documentation-only decision.

Task-owned browser sessions were closed and process cleanup verified. Existing user browser profiles, installed extensions and saved data were untouched. No preview server was started. Original preview media retains its original capture-version labels.
