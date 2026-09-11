# Spottr Release and Packaging Guide

Publishing is a separate, approval-gated action. Building and inspecting a package does not publish it.

## Verified repository flow

As of September 10, 2026, the GitHub default and integration branch is `main`. The three existing pull requests were feature branches merged into `main`. The repository has no GitHub releases, release tags, or release workflow. The first public beta release process is therefore manual until an approved automation is added.

## Build the package

1. Start from an approved commit based on the latest `origin/main`.
2. Confirm that `package.json` and `manifest.json` use the same new version.
3. Run:

```sh
npm run build
```

The build runs the source and manifest check, runs all automated tests, then creates:

```text
dist/spottr-v<version>.zip
dist/spottr-v<version>.zip.sha256
```

The package script copies an explicit runtime allowlist into a temporary directory, normalizes file timestamps, adds files in a deterministic order, strips extra ZIP metadata, and calculates SHA-256. The ZIP contains no repository history, tests, development documentation, local paths, environment files, or unrelated icons.

## Inspect the artifact

List every entry and confirm `manifest.json` is at the root:

```sh
unzip -Z1 dist/spottr-v0.2.0.zip
```

Verify archive integrity and checksum:

```sh
unzip -t dist/spottr-v0.2.0.zip
shasum -a 256 -c dist/spottr-v0.2.0.zip.sha256
```

Run `npm run package` a second time without source changes and verify that the SHA-256 value is unchanged.

## Test the packaged extension

1. Extract the ZIP into a new temporary directory.
2. Open `chrome://extensions` in a clean Chrome profile.
3. Enable **Developer mode** and choose **Load unpacked**.
4. Select the extracted directory, not the repository working tree.
5. Confirm the welcome page opens automatically.
6. Complete every item in the release QA checklist below.

## Release QA checklist

- [ ] Fresh installation and install-time onboarding
- [ ] Rectangle capture, including a high-DPR viewport
- [ ] Text-only note
- [ ] Create and switch projects
- [ ] Create and switch QA sessions
- [ ] Move a note to another saved project and session
- [ ] View a saved screenshot in a new tab
- [ ] Copy JSON and download JSON
- [ ] Compare the exported fields with `docs/export-format.md`
- [ ] Delete one note
- [ ] Clear session notes and retain the session
- [ ] Delete an empty session
- [ ] Clear project notes and retain the project
- [ ] Delete an empty project
- [ ] Press a non-Escape key and then Escape during rectangle selection
- [ ] Press Escape in the note composer
- [ ] Attempt capture on `chrome://extensions`, a Chrome Web Store page, and a local `file://` page
- [ ] Force or simulate a storage, clipboard, and download failure and verify actionable guidance
- [ ] Inspect the ZIP and checksum
- [ ] Verify the README, privacy notice, support guide, listing copy, and export schema against the tested behavior

Do not describe the beta as release-ready while any required workflow is untested, failing, or dependent on an unresolved public URL or asset.

## Approval-gated publication steps

After the package and QA report are approved:

1. Choose and publish the homepage, privacy, and support URLs.
2. Produce the neutral store screenshots and promotional assets.
3. Complete the Developer Dashboard privacy-practices fields.
4. Upload the ZIP to the Chrome Web Store.
5. Review the listing, distribution, and privacy values before submitting for review.
6. Create any Git tag, GitHub release, push, pull request, or public repository change only with explicit current approval.

Chrome's [extension preparation guide](https://developer.chrome.com/docs/webstore/prepare) requires the ZIP manifest at the archive root. The [update guide](https://developer.chrome.com/docs/webstore/update) requires each uploaded package to use a higher manifest version.
