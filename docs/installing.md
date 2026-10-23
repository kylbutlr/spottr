# Install and update Spottr

Spottr is free, public-source software distributed through [GitHub Releases](https://github.com/kylbutlr/spottr/releases). It is loaded as an unpacked Chrome extension. It has no installer, account, automatic update service, or Chrome Web Store listing.

## Install a download

1. Download `spottr-v<version>.zip` and its matching `.zip.sha256` file from the release. Choose the Spottr extension ZIP, not GitHub's generated source-code archive.
2. If desired, verify the checksum from the folder containing both files. On macOS, run `shasum -a 256 -c spottr-v<version>.zip.sha256`; on Linux, use `sha256sum -c spottr-v<version>.zip.sha256`.
3. Extract the ZIP into a permanent folder you will keep. `manifest.json` should be directly inside it.
4. Open `chrome://extensions` in Chrome and enable **Developer mode**.
5. Choose **Load unpacked** and select that folder.
6. Pin Spottr from the Extensions menu. Reload webpages already open before installation.

Chrome 102 or newer is required. No Node.js or build tools are required for a downloaded extension package. Chrome manages Developer mode and extension access; Spottr does not bypass those controls.

## Update an existing installation

1. Export any important QA sessions before updating. Exports are evidence files, not importable backups; Spottr currently has no import feature.
2. Finish or cancel any open capture or unsaved note, and close Spottr's screenshot editor and viewer tabs.
3. Download and verify the new release, then extract it into a temporary folder.
4. Replace the files inside the existing installation folder with the new package contents, keeping the original folder path.
5. In `chrome://extensions`, choose **Reload** on the existing Spottr card. Do not remove the extension or load a second copy to perform an update.
6. Reload the webpages you are reviewing, reopen Spottr, and check the version in **Quick start**. Confirm that your projects and notes remain available.

If an update fails, keep the installation folder and profile intact and report it through the [issue tracker](https://github.com/kylbutlr/spottr/issues). Do not clear storage or uninstall as a troubleshooting shortcut.

## Install from source

Clone the [repository](https://github.com/kylbutlr/spottr), then select its folder using **Load unpacked**. The source is already executable; building is needed only to validate and package a release.

For development, use Node.js 22 and run `npm run build`. The [release guide](releasing.md) covers package verification and the installed-extension checklist.

## Storage and removal

Notes and screenshots belong to the Chrome profile and extension installation where they were saved. Removing Spottr or clearing its extension data removes local evidence. Export what you need before removal. Spottr has no remote copy or recovery service.

See [Chrome's unpacked-extension instructions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) and [Spottr troubleshooting](../SUPPORT.md).
