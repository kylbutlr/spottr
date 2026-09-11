# Spottr Support and Troubleshooting

Spottr public beta is designed to work without an account or network connection. Most problems come from Chrome restricting the current page, the page changing during capture, or the local browser profile running short on storage.

## Capture will not start

- Open a normal http or https webpage and try again.
- Chrome blocks extensions on `chrome://` pages, the Chrome Web Store, extension pages, browser UI, and some built-in viewers.
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

Public beta support will be provided through the Support link on Spottr's Chrome Web Store listing. A permanent public support URL must be selected before publication.
