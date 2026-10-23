# App Stylr implementation notes

Spottr follows the dark semantic palette and bundled Geist fonts from App Stylr v1.2.0. Mint identifies primary actions and keyboard focus; sans-serif labels keep controls readable, and Geist Mono is reserved for captured metadata and shortcut values.

Product layouts are specific to a browser extension: a 400px popup, a compact responsive composer, and wider screenshot review and help pages. Shared page defaults live in `styles/base.css`. The injected controls retain their own semantic variables and styles inside Shadow DOM so the host page cannot restyle them.

There are no intentional palette exceptions. The area selector uses a transparent capture rectangle so the source page remains visible. The composer restores the previous page focus when dismissed and keeps note drafts available after a failed save.

Rendered and installed-extension verification is required before release. Source conventions and automated checks alone do not establish visual or accessibility acceptance.

The static design detector flags missing `src` attributes on the viewer and restricted-capture screenshot images. These are data-bound images, not placeholders: their containers start hidden, their scripts load an actual saved screenshot, and the containers are revealed only after data is available. The restricted editor also waits for image decoding. Keep the empty and error paths in the browser QA pass.
