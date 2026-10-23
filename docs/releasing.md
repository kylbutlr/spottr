# Release Spottr

Spottr is distributed as a free downloadable Chrome extension through [GitHub Releases](https://github.com/kylbutlr/spottr/releases). The [portfolio product page](https://kylbutlr.com/apps/spottr) points visitors to GitHub. There is no separate hosted application or Chrome Web Store publication step.

## Build and inspect

Use a clean checkout of the intended release commit, Node.js 22, npm, and the `zip` command. Keep the manifest and package versions aligned. Each release should have a distinct version and tag. The first stable release uses GitHub tag `v1.0.0`, manifest/package version `1.0.0`, and download `spottr-v1.0.0.zip`. The Quick start page reads the extension version directly from the manifest.

```sh
nvm use
npm run build
unzip -Z1 dist/spottr-v1.0.0.zip
unzip -t dist/spottr-v1.0.0.zip
cd dist
shasum -a 256 -c spottr-v1.0.0.zip.sha256
```

The example uses the current manifest version, 1.0.0. Substitute the selected release version after updating both version files. Use `sha256sum` for checksum verification on Linux.

The build validates source and permissions, runs automated tests, and creates the extension ZIP and SHA-256 file. Packaging uses an explicit runtime allowlist, normalized timestamps, deterministic entry order, and no extra ZIP metadata. The manifest is at the ZIP root; repository history, tests, developer documentation, and environment files are excluded.

Run `npm run package` again without source changes and compare the checksum to verify reproducibility. CI builds and uploads these files as workflow artifacts. CI artifacts are review builds; they are not public GitHub Releases.

## Verify the exact package

Extract the ZIP into a fresh test folder and load that folder through `chrome://extensions`, not the repository checkout. Test with neutral demo content and a separate test profile. Test an update on a disposable installation with existing projects and notes as well as a fresh install.

Record the commit, package checksum, Chrome version, OS, display scaling, tested surfaces, results, and remaining gaps in the release notes or QA report. Static checks and a passing build do not establish browser acceptance.

### Core workflow

- [ ] Fresh installation opens onboarding; help links and shortcut settings work.
- [ ] Popup capture controls are visible and usable at its native size.
- [ ] Area capture produces the correct crop, including at high display scaling and browser zoom.
- [ ] Text-only notes save without taking a screenshot.
- [ ] Projects and QA sessions can be created and switched; blank project names are rejected.
- [ ] A note can be reassigned before saving and moved after saving.
- [ ] Multiline notes keep their line breaks in review and export.
- [ ] Saved notes and screenshots persist after closing Chrome and reloading the extension.
- [ ] The screenshot viewer opens the correct evidence and handles missing notes.
- [ ] Copy JSON and Export JSON contain only the active QA session and match the export reference.
- [ ] Deleting one note and clearing a session/project remove the intended evidence only.
- [ ] Empty sessions and projects can be deleted separately.
- [ ] Updating in the same installation folder preserves existing projects, sessions, and notes.

### Interface and recovery

- [ ] Popup, composer, selector, restricted-page editor, viewer, settings, quick start, privacy, and support are inspected.
- [ ] Extension pages work at narrow, intermediate, and wide window sizes; long names and URLs wrap without hiding controls.
- [ ] Keyboard order, visible focus, Escape cancellation, focus restoration, and Enter/Shift+Enter behave as documented.
- [ ] A non-Escape key followed by Escape still cancels area selection.
- [ ] Text, focus, and controls have sufficient contrast; zoom does not make content inaccessible.
- [ ] Restricted browser/extension pages use the editor, and denied captures and local files have actionable errors.
- [ ] Failed saves retain the draft and offer recovery; successful saves are confirmed only after storage commits.
- [ ] Storage, clipboard, and download failure paths are inspected in the packaged extension.
- [ ] Screenshots documenting every affected surface use neutral content with no private data.

Do not publish with failing or untested required items. Record the reason and owner for any unresolved item.

## Publish manually

After the exact package passes verification:

1. Confirm that the public source commit and version match the verified package.
2. Create the version tag and GitHub Release for that commit.
3. Attach the extension ZIP and its matching SHA-256 file. Do not rely on GitHub's generated source archive as the primary download.
4. Include concise changes, supported Chrome version, [installation/update instructions](installing.md), [privacy notice](../PRIVACY.md), and [support](https://github.com/kylbutlr/spottr/issues).
5. Download the published files and verify their checksum against the tested package.
6. Confirm that the [portfolio page](https://kylbutlr.com/apps/spottr) routes to the release destination and describes the current product accurately.

The stable portfolio destination is [the repository's Releases page](https://github.com/kylbutlr/spottr/releases). Once a release exists, `https://github.com/kylbutlr/spottr/releases/latest` can point directly to the latest release. Do not claim that a release is available until the public assets have been verified.
