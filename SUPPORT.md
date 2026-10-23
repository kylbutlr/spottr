# Spottr Support and Troubleshooting

Spottr is designed to work without an account or network connection. Most problems come from Chrome restricting the current page, the page changing during capture, or the local browser profile running short on storage.

## Capture will not start

- On another extension's page, choose **Capture area** for a screenshot or **Add text-only note** without one. Spottr opens its own editor because Chrome prevents Spottr from placing controls inside that page.
- If Chrome hides the source URL or title, add them manually in the screenshot editor if they matter to your QA note.
- If Chrome denies the screenshot itself, try a normal http or https page. Spottr cannot override that browser decision.
- Spottr does not request access to `file://` pages. Serve a local file over localhost before capturing it.
- Reload a webpage that was already open when Spottr was installed, then retry.
- Keep the page active while starting and completing the capture.

## The screenshot is missing or incorrect

- Spottr captures only the visible viewport, not a full scrolling page.
- Keep the target tab active until the note composer appears.
- If the page zoom, viewport, or browser window changes during selection, cancel with Escape and start again.
- Try a smaller rectangle if the page or browser is low on memory.

## A note will not save

- Add a note description.
- Confirm that the selected project and QA session are still available.
- Delete unneeded screenshot-backed notes if the Chrome profile is low on storage.
- Copy or export important sessions before clearing data or reinstalling.

## Copy or export failed

- If **Copy JSON** fails, use **Export JSON**.
- If **Export JSON** fails, use **Copy JSON** and paste into a local text file.
- Large screenshot-backed sessions produce large JSON files. Split the review into smaller QA sessions if needed.
- Keep the popup open until Spottr confirms the copy or download.

## Keyboard shortcuts

Open Spottr settings and choose **Configure shortcuts**. Chrome manages shortcut conflicts, so a key combination already assigned to Chrome or another extension may need to be changed.

## Deletion and recovery

Deleting a note, clearing notes, removing extension data, and uninstalling are not reversible inside Spottr. Export important evidence first. Clearing notes keeps project and session containers, which can then be deleted separately when empty.

## Before requesting support

Record:

- Spottr version
- Chrome version
- Page type, such as public website, localhost, PDF, browser setting, or local file
- Exact steps to reproduce
- Exact on-screen message

Do not share a real export or screenshot until it has been reviewed for private URLs, access tokens, customer data, and other sensitive content.

Support is available through the [Spottr issue tracker](https://github.com/kylbutlr/spottr/issues). For installation and updates, follow the [download guide](docs/installing.md).
