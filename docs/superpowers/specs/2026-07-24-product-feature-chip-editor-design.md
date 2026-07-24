# Product Feature Chip Editor — Design Spec

Date: 2026-07-24

## Problem

`ProductForm.jsx`'s "Features" field (rendered on the product detail page as the "Key Features Included" checklist) is a plain textarea where the admin must type one feature per line. This is unintuitive for a non-technical admin — no visible list of what's already added, easy to accidentally merge/delete lines, no reordering affordance.

## Design

Replace the textarea with a chip/list editor, matching the pattern already used for the manual product picker in `src/admin/pages/sections/HomeSectionList.jsx`:

- A text input + inline "Add" button (also triggers on Enter) to add one feature.
- Added features render as a list of rows below, each showing the feature text with ▲ (move up), ▼ (move down), and ✕ (remove) controls.
- Internal form state (`form.features`) changes type from a newline-joined string to a plain `string[]` array — consistent with how `manualProducts` is already handled in `HomeSectionList`.
- On submit, `features` is sent as-is (already an array) instead of being split from a string — this actually simplifies `handleSubmit`.
- On load (editing an existing product), `features` initializes directly from `existing.features || []` (no `.join("\n")` needed anymore).
- No backend/model changes — `Product.features` is already `[String]`.

## Edge Cases

- Empty/whitespace-only input: "Add" is a no-op (trimmed value must be non-empty).
- Duplicate feature text: allowed (no dedup) — matches today's behavior (duplicate lines in the textarea were already allowed).

## Out of Scope

- No change to any other ProductForm field.
- No change to how `ProductDetail.jsx` renders `product.features` (already correct).
