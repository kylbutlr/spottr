# Spottr JSON Export Format

Spottr exports one active project and QA session at a time. The top-level `schemaVersion` identifies the contract. Version 1 is the current public beta format.

## Top-level object

| Field | Type | Meaning |
| --- | --- | --- |
| `schemaVersion` | number | Export contract version. Currently `1`. |
| `exportedAt` | ISO 8601 string | Time the export payload was created. |
| `target` | object | Project, environment, and QA session represented by the export. |
| `notes` | array | Notes in ascending `createdAt` order. May be empty. |

## Target object

| Field | Type | Meaning |
| --- | --- | --- |
| `projectId` | string | Locally generated stable project identifier. |
| `projectName` | string | User-facing project name. |
| `environment` | string | Page-derived context such as `Local`, `Netlify preview`, `Vercel preview`, or `Web preview`. |
| `runId` | string | Locally generated stable QA session identifier. The name is retained for schema compatibility. |
| `runLabel` | string | User-facing QA session label. The name is retained for schema compatibility. |

## Note object

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Locally generated note identifier. |
| `projectId` | string | Owning project identifier. |
| `projectName` | string | Owning project name at export time. |
| `environment` | string | Environment derived from the captured page. |
| `runId` | string | Owning QA session identifier. |
| `runLabel` | string | Owning QA session label. |
| `message` | string | Whitespace-normalized note text. |
| `url` | string | Raw page URL captured at note creation time. |
| `normalizedUrl` | string | URL with the fragment and common temporary token parameters removed. |
| `pageTitle` | string | Page title captured at note creation time. |
| `viewport` | object or null | CSS viewport `width`, `height`, and `devicePixelRatio`. |
| `scroll` | object or null | Page scroll position as `x` and `y`. |
| `selection` | object or null | Rectangle as CSS-pixel `x`, `y`, `width`, and `height`. `null` for text-only notes. |
| `screenshot` | object or null | `mimeType` and a WebP `data` URL. `null` for text-only notes. |
| `createdAt` | ISO 8601 string | Time the note was saved. |

## URL normalization

Spottr preserves the raw URL in `url`. The `normalizedUrl` convenience field removes the URL fragment and query parameters named `access_token`, `auth_token`, `cache_bust`, `cachebust`, `preview_token`, `previewtoken`, or `token`, without regard to letter case. Other query parameters remain.

Normalization is not a security or redaction guarantee. Review both URL fields before sharing an export.

## Screenshot data

Screenshot-backed notes embed the cropped image directly in JSON as a `data:image/webp;base64,...` string. This keeps the export self-contained but can make the file large. Consumers should tolerate `screenshot: null` and `selection: null` for text-only notes.

See [export-example.json](export-example.json) for a safe, non-production example. The placeholder screenshot string is intentionally not a usable image.
